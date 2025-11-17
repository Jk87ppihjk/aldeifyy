// ! Arquivo: orderCreationRoutes.js (UNIFICADO - COM LOGS DE SPLIT DETALHADOS)

const express = require('express');
const router = express.Router();
const pool = require('./config/db');
const { protectSeller } = require('./sellerAuthMiddleware'); 
const { protectDeliveryPerson } = require('./deliveryAuthMiddleware');
const { protect, protectWithAddress } = require('./authMiddleware'); 

// 1. IMPORTAÇÃO DO MERCADO PAGO 
const { MercadoPagoConfig, Preference } = require('mercadopago');

// --- Constantes Comuns ---
const MARKETPLACE_FEE_RATE = 0.08; // 8% (Taxa ajustada)
const DELIVERY_FEE = 5.00; // R$ 5,00 (Taxa de entrega por loja) // <--- CORRIGIDO: De 0.00 para 5.00

// ===================================================================
// FUNÇÃO AUXILIAR DE CRIAÇÃO (Permanece a mesma)
// ===================================================================
const createOrderAndCodes = async (buyerId, storeId, totalAmount, initialStatus, transactionId, items, addressSnapshot) => {
    // ... (Seu código existente para criar o pedido e gerenciar estoque) ...
    const deliveryCode = Math.random().toString(36).substring(2, 8).toUpperCase(); 
    const pickupCode = Math.random().toString(36).substring(2, 7).toUpperCase(); 

    // Insere o pedido com o endereço segmentado e o total final
    const [orderResult] = await pool.execute(
        `INSERT INTO orders (
            buyer_id, store_id, total_amount, status, delivery_code, payment_transaction_id, delivery_pickup_code,
            delivery_city_id, delivery_district_id, delivery_address_street, 
            delivery_address_number, delivery_address_nearby, buyer_whatsapp_number
         ) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            buyerId, storeId, totalAmount, initialStatus, deliveryCode, transactionId, pickupCode,
            addressSnapshot.city_id, 
            addressSnapshot.district_id, 
            addressSnapshot.address_street, 
            addressSnapshot.address_number, 
            addressSnapshot.address_nearby, 
            addressSnapshot.whatsapp_number 
        ]
    );
    const orderId = orderResult.insertId;

    // Lógica de diminuição de estoque (Sua lógica corrigida)
    for (const item of items) {
        const productId = parseInt(item.product_id, 10) || parseInt(item.id, 10);
        const quantity = parseInt(item.qty, 10);

        if (!productId || !quantity) {
             throw new Error('Item inválido no carrinho durante a criação do pedido.');
        }

        const [stockUpdate] = await pool.execute(
            'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ? AND stock_quantity >= ?',
            [quantity, productId, quantity]
        );
        if (stockUpdate.affectedRows === 0) {
            throw new Error(`Estoque insuficiente para o item ID ${productId}.`);
        }
    }
    
    return { orderId, deliveryCode, pickupCode };
};


// ===================================================================
// ROTAS DE ADMINISTRAÇÃO E CONTRATO (Permanece a mesma)
// ===================================================================
router.put('/contract/:storeId', protectSeller, async (req, res) => {
    // ... (Seu código inalterado) ...
    const storeId = req.params.storeId;
    const sellerId = req.user.id;
    const { delivery_person_id } = req.body; 

    const [storeCheck] = await pool.execute(
        'SELECT id FROM stores WHERE id = ? AND seller_id = ?',
        [storeId, sellerId]
    );

    if (storeCheck.length === 0) {
        return res.status(403).json({ success: false, message: 'Acesso negado ou loja não encontrada.' });
    }

    try {
        if (delivery_person_id) {
            const [dpCheck] = await pool.execute(
                'SELECT id FROM users WHERE id = ? AND is_delivery_person = TRUE',
                [delivery_person_id]
            );
            if (dpCheck.length === 0) {
                return res.status(400).json({ success: false, message: 'ID fornecido não corresponde a um entregador cadastrado.' });
            }
        }
        
        await pool.execute(
            'UPDATE stores SET contracted_delivery_person_id = ? WHERE id = ?',
            [delivery_person_id || null, storeId]
        );

        const status = delivery_person_id ? 'CONTRATADO' : 'DEMITIDO';
        res.status(200).json({ success: true, message: `Entregador ${status} com sucesso!` });

    } catch (error) {
        console.error('[DELIVERY/CONTRACT] Erro ao gerenciar contrato:', error);
        res.status(500).json({ success: false, message: 'Erro interno ao salvar contrato.' });
    }
});


// ===================================================================
// FUNÇÃO DE CÁLCULO DE TOTAL (Permanece a mesma)
// ===================================================================
const calculateDynamicTotal = async (items) => {
    // ... (Seu código inalterado, que foi corrigido na mensagem anterior) ...
    const productIds = items
        .map(item => parseInt(item.product_id, 10))
        .filter(id => !isNaN(id) && id > 0);

    if (productIds.length === 0) {
         throw new Error('Carrinho vazio ou contendo apenas itens inválidos.');
    }
    
    const idList = productIds.join(','); 
    
    const [products] = await pool.query(
        `SELECT p.id, p.price, s.id AS store_id 
         FROM products p JOIN stores s ON p.seller_id = s.seller_id 
         WHERE p.id IN (${idList})` 
    );
    
    if (products.length === 0) {
        throw new Error('Nenhum produto válido encontrado no banco de dados.');
    }

    const productMap = products.reduce((map, p) => {
        map[p.id] = p;
        return map;
    }, {});
    
    let subTotalProdutos = 0;
    const lojasUnicas = new Set();
    
    for (const item of items) {
        const productIdNum = parseInt(item.product_id, 10);
        const productInfo = productMap[productIdNum];

        if (!productInfo) {
            console.warn(`[calculateDynamicTotal] Item ID ${productIdNum} ignorado.`);
            continue; 
        }

        subTotalProdutos += parseFloat(productInfo.price) * item.qty;
        lojasUnicas.add(productInfo.store_id);
    }
    
    const freteTotal = lojasUnicas.size * DELIVERY_FEE;
    const valorTotal = subTotalProdutos + freteTotal;
    
    return { valorTotal, freteTotal, subTotalProdutos, numeroDeLojas: lojasUnicas.size };
};


// ===================================================================
// FUNÇÃO AUXILIAR DE PAGAMENTO (COM LOGS DETALHADOS)
// ===================================================================
/**
 * Cria a preferência de pagamento no Mercado Pago usando o token do vendedor.
 */
async function createMercadoPagoPreference(productId, payerEmail, totalAmount, orderId, sellerToken, sellerId) {
    
    if (!sellerToken) {
      throw new Error('Vendedor ou Token de Produção não encontrado no DB.');
    }

    // Calcula a Taxa do Marketplace (usando a constante de 8%)
    const marketplaceFeeAmount = parseFloat((totalAmount * MARKETPLACE_FEE_RATE).toFixed(2));
    const sellerNetReceive = parseFloat((totalAmount - marketplaceFeeAmount).toFixed(2));

    // O Mercado Pago espera a taxa em porcentagem, não em valor absoluto
    const marketplaceFeePercentage = parseFloat((marketplaceFeeAmount / totalAmount * 100).toFixed(2));
    
    // ! LOG DETALHADO PARA AUDITORIA DO SPLIT
    console.log(`[MP/SPLIT] --- INÍCIO AUDITORIA Pedido #${orderId} ---`);
    console.log(`[MP/SPLIT] Valor Total (Base): R$ ${totalAmount.toFixed(2)}`);
    console.log(`[MP/SPLIT] Taxa da Plataforma (Marketplace Fee): R$ ${marketplaceFeeAmount.toFixed(2)} (${marketplaceFeePercentage}%)`);
    console.log(`[MP/SPLIT] Valor Líquido para o Vendedor (ID: ${sellerId}): R$ ${sellerNetReceive.toFixed(2)}`);
    console.log(`[MP/SPLIT] --- FIM AUDITORIA ---`);
    
    // 1. Usa o Token do Vendedor 
    const sellerClient = new MercadoPagoConfig({ accessToken: sellerToken });
    const preference = new Preference(sellerClient);

    const body = {
      items: [
        {
          id: productId.toString(),
          title: `Pedido #${orderId} - Marketplace`,
          description: `Pagamento referente ao pedido ${orderId}`,
          unit_price: parseFloat(totalAmount), 
          quantity: 1,
        }
      ],
      payer: { email: payerEmail },
      
      // Cobra a taxa do marketplace do vendedor
      marketplace_fee: marketplaceFeeAmount, // <--- CORREÇÃO CRÍTICA APLICADA: Enviando valor absoluto em R$
      
      // Vincula o pagamento ao nosso pedido
      external_reference: orderId.toString(), 

      payment_methods: {
          installments: 1, 
      },
      
      // URLs de retorno para o cliente
      back_urls: {
        success: `${process.env.FRONTEND_URL}/meus-pedidos?status=success&order_id=${orderId}`,
        failure: `${process.env.FRONTEND_URL}/meus-pedidos?status=failure&order_id=${orderId}`,
      },
      
      // URL de Webhook aponta para a rota local unificada
      notification_url: `${process.env.BACKEND_URL}/api/mp/webhook-mp`, 
    };

    const response = await preference.create({ body });
    
    return { 
        init_point: response.init_point,
        preference_id: response.id 
    };
}


// ===================================================================
// ROTA DE CRIAÇÃO DE PEDIDOS (CHECKOUT)
// ===================================================================
router.post('/orders', [protect, protectWithAddress], async (req, res) => {
    const buyerId = req.user.id;
    const { items } = req.body; // Espera { items: [...] }
    const addressSnapshot = { ...req.user };
    const payerEmail = req.user.email; 

    if (!items || items.length === 0) {
        return res.status(400).json({ success: false, message: 'Carrinho vazio.' });
    }
    
    let orderId; 

    try {
        // 1. CALCULA O TOTAL 
        const { valorTotal, numeroDeLojas } = await calculateDynamicTotal(items);
        
        if (numeroDeLojas !== 1) {
             return res.status(400).json({ success: false, message: 'Esta rota é mono-loja. Por favor, crie um pedido separado para cada loja.' });
        }
        
        // Pega o ID da loja e o ID do vendedor
        const productIds = items.map(item => parseInt(item.product_id, 10)).filter(id => !isNaN(id) && id > 0);
        const [products] = await pool.execute('SELECT s.id AS store_id, s.seller_id FROM products p JOIN stores s ON p.seller_id = s.seller_id WHERE p.id = ? LIMIT 1', [productIds[0]]);
        
        if (!products[0]) {
            throw new Error('Produto ou loja não encontrados.');
        }

        const store_id = products[0].store_id;
        const seller_id = products[0].seller_id;
        const firstProductId = productIds[0].toString();
        
        // 2. BUSCAR O TOKEN DO VENDEDOR NO BANCO DE DADOS LOCAL
        const [sellerRows] = await pool.execute(
            `SELECT mp_access_token 
             FROM users
             WHERE id = ? LIMIT 1`,
            [seller_id]
        );

        if (!sellerRows[0] || !sellerRows[0].mp_access_token) {
            throw new Error(`O vendedor (ID: ${seller_id}) não conectou sua conta do Mercado Pago.`);
        }
        const sellerToken = sellerRows[0].mp_access_token;
        
        await pool.query('BEGIN'); 
        
        // 3. CRIA O PEDIDO NO NOSSO DB PRIMEIRO (Status: Pending Payment)
        const orderData = await createOrderAndCodes(
            buyerId, store_id, valorTotal, 'Pending Payment', 
            'TEMP_MP_ID', 
            items, addressSnapshot
        );
        orderId = orderData.orderId; 

        // 4. CHAMA A FUNÇÃO LOCAL (Agora com logs detalhados)
        const { init_point, preference_id } = await createMercadoPagoPreference(
            firstProductId,
            payerEmail,
            valorTotal,
            orderId, 
            sellerToken,
            seller_id // Novo argumento para o log
        );

        if (!init_point || !preference_id) {
            throw new Error('Falha ao obter init_point ou preference_id do serviço de pagamento.');
        }

        // 5. ATUALIZA O PEDIDO com o ID de transação real do MP (preference_id)
        await pool.execute(
            'UPDATE orders SET payment_transaction_id = ? WHERE id = ?',
            [preference_id, orderId]
        );

        await pool.query('COMMIT'); 

        // 6. RETORNA O LINK DE PAGAMENTO PARA O FRONTEND
        res.status(201).json({ 
            success: true, 
            message: 'Pedido criado. Redirecionando para pagamento.', 
            order_id: orderId,
            total_amount: valorTotal, 
            init_point: init_point 
        });

    } catch (error) {
        await pool.query('ROLLBACK'); 
        
        const errorDetail = error.response ? JSON.stringify(error.response.data) : error.message;
        console.error(`[DELIVERY/ORDERS] Erro no fluxo do pedido Mercado Pago (OrderID: ${orderId}):`, errorDetail);
        
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno ao processar pedido.',
            error: errorDetail
        });
    }
});


// ===================================================================
// ROTAS DE LOJISTA (PÓS-PAGAMENTO) (Permanecem iguais)
// ===================================================================

/**
 * Rota 3: Vendedor Define Método de Entrega
 */
router.put('/orders/:orderId/delivery-method', protectSeller, async (req, res) => {
    // ... (Seu código inalterado) ...
    const orderId = req.params.orderId;
    const sellerId = req.user.id;
    const { method } = req.body; 

    if (!['Contracted', 'Marketplace'].includes(method)) {
        return res.status(400).json({ success: false, message: 'Método de entrega inválido. Use Contracted ou Marketplace.' });
    }

    try {
        const [orderCheck] = await pool.execute(
            `SELECT o.store_id, s.contracted_delivery_person_id, o.status 
             FROM orders o 
             JOIN stores s ON o.store_id = s.id 
             WHERE o.id = ? AND s.seller_id = ?`,
            [orderId, sellerId]
        );

        if (orderCheck.length === 0) {
            return res.status(403).json({ success: false, message: 'Acesso negado ou pedido não encontrado.' });
        }
        
        if (orderCheck[0].status !== 'Processing') {
             return res.status(400).json({ success: false, message: 'O pedido não está no status "Processing" para definir o método de entrega.' });
        }

        const store = orderCheck[0];
        let deliveryPersonId = null;

        if (method === 'Contracted') {
            deliveryPersonId = store.contracted_delivery_person_id;
            if (!deliveryPersonId) {
                return res.status(400).json({ success: false, message: 'Loja não possui entregador contratado. Solicite o Marketplace.' });
            }
        }
        
        await pool.execute(
            'UPDATE orders SET delivery_method = ?, status = "Delivering" WHERE id = ?',
            [method, orderId]
        );
        
        await pool.execute(
            `INSERT INTO deliveries (order_id, delivery_person_id, status, delivery_method) VALUES (?, ?, ?, ?)`,
            [orderId, deliveryPersonId, deliveryPersonId ? 'Accepted' : 'Requested', method]
        );

        if (method === 'Contracted' && deliveryPersonId) {
             await pool.execute('UPDATE users SET is_available = FALSE WHERE id = ?', [deliveryPersonId]);
        }

        res.status(200).json({ success: true, message: `Entrega definida como "${method}".` });

    } catch (error) {
        console.error('[DELIVERY/METHOD] Erro ao definir método de entrega:', error);
        res.status(500).json({ success: false, message: 'Erro interno ao processar a entrega.' });
    }
});


/**
 * Rota 9: Vendedor Despacha o Pedido (Self-Delivery)
 */
router.put('/orders/:orderId/dispatch', protectSeller, async (req, res) => {
    // ... (Seu código inalterado) ...
    const orderId = req.params.orderId;
    const sellerId = req.user.id;

    try {
        await pool.query('BEGIN'); 

        const [orderCheck] = await pool.execute(
            `SELECT o.id, s.seller_id FROM orders o 
             JOIN stores s ON o.store_id = s.id 
             WHERE o.id = ? AND s.seller_id = ? AND o.status = 'Processing'`,
            [orderId, sellerId]
        );

        if (orderCheck.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json({ success: false, message: 'Pedido não encontrado, não pertence a você ou não está no status "Processing".' });
        }
        
        await pool.execute(
            "UPDATE orders SET status = 'Delivering', delivery_method = 'Seller' WHERE id = ?",
            [orderId]
        );
        
        await pool.execute(
            `INSERT INTO deliveries (order_id, delivery_person_id, status, delivery_method, packing_start_time) 
             VALUES (?, NULL, 'Accepted', 'Seller', NOW())`, 
            [orderId]
        );
        
        await pool.query('COMMIT'); 
        res.status(200).json({ success: true, message: 'Pedido despachado! Pronto para a entrega.' });

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('[DELIVERY/DISPATCH] Erro ao despachar pedido:', error);
        res.status(500).json({ success: false, message: 'Erro interno ao despachar.' });
    }
});


/**
 * Rota 12: Vendedor Confirma Retirada do Pedido (Handover)
 */
router.put('/orders/:orderId/confirm-pickup', protectSeller, async (req, res) => {
    // ... (Seu código inalterado) ...
    const orderId = req.params.orderId;
    const sellerId = req.user.id;
    const { pickup_code } = req.body; 

    try {
        await pool.query('BEGIN');

        const [orderRows] = await pool.execute(
            `SELECT o.id, o.delivery_pickup_code, s.seller_id, d.delivery_person_id, d.status
             FROM orders o 
             JOIN stores s ON o.store_id = s.id
             LEFT JOIN deliveries d ON o.id = d.order_id
             WHERE o.id = ? AND s.seller_id = ? AND o.status = 'Delivering'`,
            [orderId, sellerId]
        );
        const order = orderRows[0];
        
        if (!order || order.delivery_person_id === null || order.delivery_person_id === 0) { 
            await pool.query('ROLLBACK');
            return res.status(400).json({ success: false, message: 'Pedido inválido ou entregador não atribuído.' });
        }

        if (order.delivery_pickup_code !== pickup_code) {
             await pool.query('ROLLBACK');
             return res.status(400).json({ success: false, message: 'Código de retirada inválido.' });
        }

        await pool.execute(
            `UPDATE deliveries SET 
             status = 'PickedUp', 
             packing_start_time = NOW(),
             pickup_time = NOW() 
             WHERE order_id = ?`,
            [orderId]
        );

        await pool.query('COMMIT');

        res.status(200).json({ success: true, message: 'Retirada confirmada. Entregador em rota.' });

    } catch (error) {
        await pool.query('ROLLBACK');
        console.error('[DELIVERY/CONFIRM_PICKUP] Erro ao confirmar retirada:', error);
        res.status(500).json({ success: false, message: 'Erro interno ao confirmar retirada.' });
    }
});


// Rota /mp-webhook-receiver removida e movida para mercadoPagoRoutes.js


module.exports = router;
