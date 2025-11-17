// ! Arquivo: productRoutes.js (CORRIGIDO: REMOVIDA TAXA FIXA DE R$10.00 DO PREÇO DO PRODUTO)
const express = require('express');
const router = express.Router();
const { protectSeller } = require('./sellerAuthMiddleware'); 
const { protect } = require('./authMiddleware'); 
const pool = require('./config/db'); // Importa o pool compartilhado

// --- Constantes de Preço (REMOVIDA A ADIÇÃO FIXA) ---
const MARKETPLACE_FEE = 0.00; // Taxa do Marketplace (Agora é 10% e retirada do lojista, não adicionada)
const DELIVERY_FEE = 0.00;     // Taxa de Entrega (Cobrada separadamente no checkout - R$5.00)
const TOTAL_ADDITION = MARKETPLACE_FEE + DELIVERY_FEE; // R$ 0.00 (Nova soma)

// -------------------------------------------------------------------
// Rotas de Produtos
// -------------------------------------------------------------------

// 1. Rota para CRIAR um novo produto (PROTEGIDA)
router.post('/products', protectSeller, async (req, res) => {
    const seller_id = req.user.id; 
    
    try {
        const [storeCheck] = await pool.execute('SELECT id FROM stores WHERE seller_id = ?', [seller_id]);
        
        if (storeCheck.length === 0) {
            return res.status(403).json({ success: false, message: 'A criação de produtos requer que sua loja esteja cadastrada primeiro.' });
        }
        
        // Desestruturação dos dados
        const { name, description, price, stock_quantity, subcategory_id, image_url, fy_video_id, attributes_data } = req.body;

        // Validação básica
        if (!name || !price || !subcategory_id) {
            return res.status(400).json({ success: false, message: 'Nome, Preço e Subcategoria são obrigatórios.' });
        }
        
        // Lógica de preço: O preço final é AGORA o preço base (sem adição)
        const basePrice = parseFloat(price);
        const finalPrice = basePrice + TOTAL_ADDITION; 
        console.log(`[PRODUCTS/POST] Preço Base: R$${basePrice.toFixed(2)}. Preço Final no DB: R$${finalPrice.toFixed(2)}`);
        
        // Converte o objeto de atributos em string JSON para salvar no DB
        const attributesJson = attributes_data ? JSON.stringify(attributes_data) : null;

        const [result] = await pool.execute(
            `INSERT INTO products 
            (seller_id, name, description, price, stock_quantity, subcategory_id, image_url, fy_video_id, attributes_data) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, 
            [
                seller_id, 
                name, 
                description || null,    // FIX: Converte undefined para null
                finalPrice, 
                stock_quantity || null, // FIX: Converte undefined para null
                subcategory_id || null,
                image_url || null,      // FIX: Converte undefined para null
                fy_video_id || null, 
                attributesJson
            ]
        );
        
        // Mensagem atualizada para refletir a nova lógica
        res.status(201).json({ 
            success: true, 
            message: 'Produto criado com sucesso. O preço final agora é apenas o preço base, sem taxas fixas adicionadas.', 
            product_id: result.insertId 
        });

    } catch (error) {
        console.error('[PRODUCTS] ERRO ao criar produto:', error);
        res.status(500).json({ success: false, message: 'Erro interno ao salvar produto.' });
    }
});


// 2. Rota para LER a lista de produtos (PÚBLICA - PARA index.html)
router.get('/products', async (req, res) => {
    const categoryId = req.query.category_id;
    const subcategoryId = req.query.subcategory_id;
    
    let whereClause = 'WHERE p.is_active = TRUE';
    const queryParams = [];

    // Filtro por Categoria Principal (Loja)
    if (categoryId) {
        whereClause += ' AND s.category_id = ?';
        queryParams.push(categoryId);
    }
    
    // Filtro por Subcategoria (Produto)
    if (subcategoryId) {
        whereClause += ' AND p.subcategory_id = ?';
        queryParams.push(subcategoryId);
    }

    try {
        const query = `
            SELECT p.*, s.id AS store_id, s.name AS store_name, u.full_name AS seller_name, u.city 
            FROM products p
            JOIN stores s ON p.seller_id = s.seller_id
            JOIN users u ON p.seller_id = u.id
            ${whereClause}
        `;
        
        const [products] = await pool.execute(query, queryParams);
        
        res.status(200).json({ success: true, count: products.length, products });

    } catch (error) {
        console.error('[PRODUCTS] ERRO ao buscar produtos públicos com filtros:', error);
        res.status(500).json({ success: false, message: 'Erro interno ao carregar produtos.' });
    }
});


// 3. Rota para BUSCAR PRODUTO POR ID (PÚBLICA - PARA product_page.html)
router.get('/products/:id', async (req, res) => {
    const productId = req.params.id;

    try {
        const [rows] = await pool.execute(
            `SELECT p.*, s.id AS store_id, s.name AS store_name, u.full_name AS seller_name, u.city 
             FROM products p
             JOIN stores s ON p.seller_id = s.seller_id
             JOIN users u ON p.seller_id = u.id
             WHERE p.id = ? AND p.is_active = TRUE LIMIT 1`,
            [productId]
        );

        const product = rows[0];

        if (!product) {
            return res.status(404).json({ success: false, message: 'Produto não encontrado ou inativo.' });
        }

        res.status(200).json({ success: true, product });

    } catch (error) {
        console.error('[PRODUCTS/:ID] ERRO ao buscar produto por ID:', error);
        res.status(500).json({ success: false, message: 'Erro interno ao carregar o produto.' });
    }
});


// 4. Rota para LER os produtos DE UM LOJISTA (PROTEGIDA - PARA painel.html)
router.get('/products/store/:sellerId', protectSeller, async (req, res) => {
    const seller_id = req.params.sellerId;

    if (req.user.id.toString() !== seller_id) {
         return res.status(403).json({ success: false, message: 'Acesso negado. Você não tem permissão para ver estes produtos.' });
    }
    
    try {
        const [products] = await pool.execute(
            'SELECT * FROM products WHERE seller_id = ? ORDER BY created_at DESC',
            [seller_id]
        );
        
        res.status(200).json({ success: true, products });
    } catch (error) {
        console.error('[PRODUCTS/STORE] Erro ao buscar produtos da loja:', error);
        res.status(500).json({ success: false, message: 'Erro interno ao buscar produtos.' });
    }
});


// 5. Rota para ATUALIZAR um produto (PROTEGIDA)
router.put('/products/:id', protectSeller, async (req, res) => {
    const productId = req.params.id;
    const seller_id = req.user.id; 
    
    // Desestruturação dos dados
    const { name, description, price, stock_quantity, subcategory_id, image_url, is_active, fy_video_id, attributes_data } = req.body;
    
    // O preço final é o preço enviado (sem adição)
    const finalPrice = parseFloat(price) + TOTAL_ADDITION; 

    // Converte o objeto de atributos em string JSON para salvar no DB
    const attributesJson = attributes_data ? JSON.stringify(attributes_data) : null;

    try {
        const [result] = await pool.execute(
            `UPDATE products SET 
             name=?, description=?, price=?, stock_quantity=?, subcategory_id=?, image_url=?, is_active=?, fy_video_id=?, attributes_data=?
             WHERE id=? AND seller_id=?`, 
            [
                name, 
                description || null,    // FIX: Converte undefined para null
                finalPrice, 
                stock_quantity || null, // FIX: Converte undefined para null
                subcategory_id || null, 
                image_url || null,      // FIX: Converte undefined para null
                is_active, 
                fy_video_id || null, 
                attributesJson, 
                productId, 
                seller_id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Produto não encontrado ou você não tem permissão para editar.' });
        }

        res.status(200).json({ success: true, message: 'Produto atualizado com sucesso.' });

    } catch (error) {
        console.error('[PRODUCTS] ERRO ao atualizar produto:', error);
        res.status(500).json({ success: false, message: 'Erro interno ao atualizar produto.' });
    }
});


// 6. Rota para DELETAR (inativar) um produto (PROTEGIDA)
router.delete('/products/:id', protectSeller, async (req, res) => {
    const productId = req.params.id;
    const seller_id = req.user.id; 

    try {
        // Soft delete (apenas marca como inativo)
        const [result] = await pool.execute(
            'UPDATE products SET is_active = FALSE WHERE id = ? AND seller_id = ?',
            [productId, seller_id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ success: false, message: 'Produto não encontrado ou você não tem permissão para inativar.' });
        }

        res.status(200).json({ success: true, message: 'Produto inativado (soft delete) com sucesso.' });

    } catch (error) {
        console.error('[PRODUCTS] ERRO ao deletar produto:', error);
        res.status(500).json({ success: false, message: 'Erro interno ao deletar produto.' });
    }
});

module.exports = router;
