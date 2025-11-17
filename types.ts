export enum Role {
    BUYER = 'buyer',
    SELLER = 'seller',
    DELIVERY = 'delivery_person',
    ADMIN = 'admin',
}

export interface User {
    id: number;
    full_name: string;
    email: string;
    role: Role;
    is_admin: boolean;
    is_seller: boolean;
    is_delivery_person: boolean;
    city_id?: number;
    district_id?: number;
    address_street?: string;
    address_number?: string;
    address_nearby?: string;
    whatsapp_number?: string;
}

export interface AuthResponse {
    token: string;
    role: Role;
    needs_setup?: boolean;
    setup_type?: 'store_setup' | 'address_setup';
    user: User;
}

export interface City {
    id: number;
    name: string;
    state_province: string;
}

export interface District {
    id: number;
    name: string;
}

export interface Category {
    id: number;
    name: string;
}

export interface Subcategory {
    id: number;
    name: string;
}

export interface Attribute {
    id: number;
    name: string;
    type: 'text' | 'select'; // Example types
    options: string | null; // e.g., "Red,Green,Blue"
}


export interface Product {
    id: number;
    name: string;
    description: string;
    price: string | number; // API might return string
    image_url: string;
    stock_quantity: number;
    store_name?: string;
    store_id?: number;
    seller_id?: number;
    is_active?: boolean;
    attributes_data?: string; // JSON string from the backend
    subcategory_id?: number;
}

export interface Store {
    id: number;
    name: string;
    bio: string;
    logo_url: string;
    banner_url: string;
    category_id: number;
    city_id: number;
    district_id: number;
    address_street: string;
    address_number: string;
    address_nearby?: string;
    whatsapp_number: string;
    category_name?: string;
    city_name?: string;
    district_name?: string;
    seller_id: number;
    contracted_delivery_person_id?: number | null;
}

export interface CartItem {
    id: string; // Composite ID: `${product_id}-${sorted_options}`
    product_id: number;
    qty: number;
    options: Record<string, string>;
    // Client-side properties
    name?: string;
    price?: number;
    image_url?: string;
    stock_quantity?: number;
}


export interface OrderItem {
    id: number;
    qty: number;
}

export interface Order {
    id: number;
    total_amount: number;
    status: 'Pending Payment' | 'Processing' | 'Delivering' | 'Completed' | 'Cancelled';
    delivery_method: 'Seller' | 'Contracted' | 'Marketplace' | null;
    delivery_status?: 'Requested' | 'Accepted' | 'PickedUp' | 'Delivered_Confirmed';
    created_at: string;
    delivery_code: string;
    store_name?: string;
    buyer_name?: string;
    delivery_person_name?: string;
    tracking_message?: string;
}

export interface OrderItemDetail {
    product_id: number;
    product_name: string;
    qty: number;
    price: number;
    image_url: string;
    options: Record<string, string>;
}

export interface OrderDetail extends Order {
    items: OrderItemDetail[];
    buyer: {
        full_name: string;
        whatsapp_number: string;
        address_street: string;
        address_number: string;
        address_nearby: string;
        district_name: string;
        city_name: string;
    };
}

export interface CartBreakdownItem extends CartItem {
    product_name: string;
    product_price: number;
    image_url: string;
    total_item_price: number;
    // FIX: Add selected_options to align with backend data and fix type errors in CartScreen.tsx.
    selected_options?: Record<string, string>;
}

export interface CartBreakdown {
    store_id: number;
    store_name: string;
    items: CartBreakdownItem[];
    subtotal_products: number;
}

export interface CalculatedCart {
    valorTotal: number;
    freteTotal: number;
    subTotalGeral: number;
    numeroDeLojas: number;
    cartBreakdown: CartBreakdown[];
}

export interface FyVideo {
    id: number;
    video_url: string;
    likes_count: number;
    comments_count: number;
    user_has_liked: boolean;
    created_at: string;
    store_name: string;
    product_id: number | null;
    product_name: string | null;
}

export interface Comment {
    id: number;
    user_name: string;
    comment_text: string;
    created_at: string;
}

export interface DeliveryJob {
    id: number;
    total_amount: number;
    delivery_code: string;
    store_name: string;
    buyer_name: string;
}

export interface CurrentDelivery {
    order: {
        id: number;
        total_amount: number;
        store_name: string;
        store_address: string;
        buyer_name: string;
        delivery_address: string;
    };
    delivery_pickup_code: string;
    status: string;
}