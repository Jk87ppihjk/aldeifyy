// ! Arquivo: cartRoutes.js (Versão Corrigida com Query Manual Segura)

const express = require('express');
const router = express.Router();
const pool = require('./config/db');
const { protect } = require('./authMiddleware');

const DELIVERY_FEE = 5.00;

const calculateCartBreakdown = async (items) => {
    
    console.log('[CART/CALC] Iniciando cálculo. Itens recebidos:', JSON.stringify(items));

    const productIds = items
        .map(item => parseInt(item.product_id, 10)) 
        .filter(id => !isNaN(id) && id > 0);
    
    console.log('[CART/CALC] IDs de produtos filtrados e limpos:', productIds);

    if (productIds.length === 0) {
        console.log('[CART/CALC] Carrinho vazio ou sem IDs válidos. Retornando 0.');
        return {
            success: true,
            valorTotal: 0,
            freteTotal: 0,
            subTotalGeral: 0,
            numeroDeLojas: 0,
            cartBreakdown: [],
        };
    }

    // ******************************************************************
    // CORREÇÃO DEFINITIVA: Bypassar a vinculação de array IN (?)
    // ******************************************************************
    
    // 1. Criar a lista de IDs manualmente. Isto é SEGURO porque 'productIds'
    //    foi garantidamente filtrado para conter apenas NÚMEROS.
    const idList = productIds.join(','); // Ex: "22" ou "22,23,24"

    // 2. Usar pool.query() para injetar a string segura (sem placeholders para o IN)
    console.log(`[CART/CALC] Executando query manual segura: WHERE p.id IN (${idList})`);
    
    const [products] = await pool.query(
        `SELECT p.id, p.name, p.price, p.image_url, s.id AS store_id, s.name AS store_name 
         FROM products p JOIN stores s ON p.seller_id = s.seller_id 
         WHERE p.id IN (${idList})` // Injeta a string de IDs diretamente
    );
    // ******************************************************************

    console.log(`[CART/CALC] ${products.length} produtos encontrados no DB.`);

    const productMap = products.reduce((map, p) => {
        map[p.id] = p;
        return map;
    }, {});
    
    const cartByStore = {};
    const lojasUnicas = new Set();
    
    for (const item of items) {
        const productIdNum = parseInt(item.product_id, 10);
        const productInfo = productMap[productIdNum];

        if (!productInfo) {
             console.warn(`[CART/CALC] Aviso: Item ${productIdNum} ignorado (não encontrado no map).`);
             continue;
        }
        
        const storeId = productInfo.store_id;
        const totalItemPrice = parseFloat(productInfo.price) * item.qty;
        
        const itemDetails = {
            product_id: productIdNum,
            product_name: productInfo.name,
            product_price: parseFloat(productInfo.price), 
            image_url: productInfo.image_url,
            quantity: item.qty,
            total_item_price: totalItemPrice,
            selected_options: item.options || {} 
        };

        if (!cartByStore[storeId]) {
            cartByStore[storeId] = {
                store_id: storeId,
                store_name: productInfo.store_name,
                items: [],
                subtotal_products: 0,
            };
        }
        
        cartByStore[storeId].items.push(itemDetails);
        cartByStore[storeId].subtotal_products += totalItemPrice;
        lojasUnicas.add(storeId);
    }
    
    const numeroDeLojas = lojasUnicas.size;
    const freteTotal = numeroDeLojas * DELIVERY_FEE;
    
    let subTotalGeral = 0;
    Object.values(cartByStore).forEach(store => {
        subTotalGeral += store.subtotal_products;
    });

    const valorTotalFinal = subTotalGeral + freteTotal;

    const finalResult = {
        success: true,
        valorTotal: parseFloat(valorTotalFinal.toFixed(2)),
        freteTotal: parseFloat(freteTotal.toFixed(2)),
        subTotalGeral: parseFloat(subTotalGeral.toFixed(2)),
        numeroDeLojas,
        cartBreakdown: Object.values(cartByStore),
    };

    console.log('[CART/CALC] Cálculo concluído com sucesso.');
    return finalResult;
};


router.post('/calculate', protect, async (req, res) => {
    console.log(`[CART/POST] Rota /api/cart/calculate acionada por utilizador ID: ${req.user.id}`);
    
    const { items } = req.body; 

    if (!items || !Array.isArray(items) || items.length === 0) {
        console.log('[CART/POST] Pedido com carrinho vazio. Retornando 0.');
        return res.status(200).json({ 
            success: true, 
            valorTotal: 0, 
            freteTotal: 0, 
            subTotalGeral: 0, 
            numeroDeLojas: 0, 
            cartBreakdown: [] 
        });
    }

    try {
        const result = await calculateCartBreakdown(items);
        res.status(200).json(result);
        
    } catch (error) {
        console.error('[CART/POST] ERRO CRÍTICO ao calcular carrinho:', error.message);
        console.error(error); 
        
        res.status(500).json({ 
            success: false, 
            message: 'Erro interno ao calcular custos.',
            error_code: error.code,
            error_no: error.errno
        });
    }
});


module.exports = router;
