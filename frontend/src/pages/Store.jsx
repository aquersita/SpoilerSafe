import React, { useEffect, useState } from 'react';

const STORE_PRODUCTS = [
    {
        id: 1,
        name: "Gojo Satoru ARTFX J 1/8 Scale Figure - Kotobukiya",
        price: 189.99,
        category: "Figuras",
        image: "/store/gojo.webp",
        tag: "Premium",
        url: "https://www.amazon.es/s?k=gojo+satoru+figure+kotobukiya"
    },
    {
        id: 2,
        name: "One Piece Manga Box Set - East Blue & Baroque Works",
        price: 145.50,
        category: "Manga",
        image: "/store/onepiece_box.webp",
        tag: "Bestseller",
        url: "https://www.amazon.es/s?k=one+piece+manga+box+set"
    },
    {
        id: 3,
        name: "Demon Slayer Nezuko Kamado Figure - Banpresto",
        price: 34.99,
        category: "Figuras",
        image: "/store/nezuko.webp",
        tag: "Nuevo",
        url: "https://www.amazon.es/s?k=nezuko+figure+banpresto"
    },
    {
        id: 4,
        name: "Naruto Akatsuki Cloak Hoodie Premium",
        price: 65.00,
        category: "Ropa",
        image: "/store/akatsuki.webp",
        tag: "",
        url: "https://www.amazon.es/s?k=naruto+akatsuki+hoodie"
    },
    {
        id: 5,
        name: "Attack on Titan Levi Ackerman Figure",
        price: 49.99,
        category: "Figuras",
        image: "/store/levi.webp",
        tag: "",
        url: "https://www.amazon.es/s?k=levi+ackerman+figure"
    },
    {
        id: 6,
        name: "Chainsaw Man Vol. 1 - Tatsuki Fujimoto",
        price: 9.99,
        category: "Manga",
        image: "/store/chainsaw.webp",
        tag: "Nuevo",
        url: "https://www.amazon.es/s?k=chainsaw+man+manga+vol+1"
    },
    {
        id: 7,
        name: "Dragon Ball Z Son Goku Figure - Banpresto DXF",
        price: 39.99,
        category: "Figuras",
        image: "/store/goku.webp",
        tag: "Bestseller",
        url: "https://www.amazon.es/s?k=dragon+ball+goku+figure+banpresto"
    },
    {
        id: 8,
        name: "Jujutsu Kaisen Camiseta Oficial Anime",
        price: 24.99,
        category: "Ropa",
        image: "/store/jjk_tee.webp",
        tag: "",
        url: "https://www.amazon.es/s?k=jujutsu+kaisen+camiseta"
    },
    {
        id: 9,
        name: "Spy x Family Anya Forger Figure",
        price: 29.99,
        category: "Figuras",
        image: "/store/anya.webp",
        tag: "Nuevo",
        url: "https://www.amazon.es/s?k=anya+forger+figure"
    },
    {
        id: 10,
        name: "My Hero Academia Deku Figure Premium",
        price: 44.99,
        category: "Figuras",
        image: "/store/deku.webp",
        tag: "",
        url: "https://www.amazon.es/s?k=deku+figure+my+hero+academia"
    },
    {
        id: 11,
        name: "One Piece Luffy Gear 5 Figure - Banpresto",
        price: 54.99,
        category: "Figuras",
        image: "/store/luffy_g5.webp",
        tag: "Premium",
        url: "https://www.amazon.es/s?k=luffy+gear+5+figure"
    },
    {
        id: 12,
        name: "Demon Slayer Set de Llaveros Coleccionables",
        price: 12.99,
        category: "Accesorios",
        image: "/store/keychains.webp",
        tag: "",
        url: "https://www.amazon.es/s?k=demon+slayer+llaveros"
    }
];

const Store = () => {
    const [activeCategory, setActiveCategory] = useState('Todos');

    const categories = ['Todos', 'Figuras', 'Manga', 'Ropa', 'Accesorios'];

    useEffect(() => { window.scrollTo(0, 0); }, []);

    const filteredProducts = activeCategory === 'Todos'
        ? STORE_PRODUCTS
        : STORE_PRODUCTS.filter(p => p.category === activeCategory);

    return (
        <div className="min-h-screen bg-gray-50 pb-16">
            {/* Category Bar */}
            <div className="sticky top-16 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 px-8 py-4 flex justify-between items-center">
                <div className="flex gap-6 text-sm font-bold tracking-widest uppercase text-gray-400">
                    {categories.map(cat => (
                        <span
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`cursor-pointer hover:text-primary transition-colors ${activeCategory === cat ? 'text-gray-900' : ''}`}
                        >
                            {cat}
                        </span>
                    ))}
                </div>
                <span className="text-xs text-gray-400 font-medium flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">storefront</span>
                    Powered by Amazon
                </span>
            </div>

            {/* Hero Banner */}
            <div className="relative w-full h-[45vh] flex items-center justify-center overflow-hidden mb-12 group">
                <img 
                    src={STORE_PRODUCTS[0].image} 
                    alt="Store Hero" 
                    className="absolute inset-0 w-full h-full object-cover opacity-20 group-hover:scale-105 transition-transform duration-700 blur-sm"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-gray-50 via-gray-50/80 to-gray-50/40"></div>
                <div className="relative z-10 text-center px-4">
                    <h1 className="text-5xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-primary to-yellow-600 mb-4 tracking-tighter" style={{ fontFamily: "'Arial Black', sans-serif" }}>
                        OTAKU STORE
                    </h1>
                    <p className="text-lg md:text-xl text-gray-600 font-medium tracking-wide max-w-2xl mx-auto">
                        Figuras, manga, ropa y accesorios oficiales. Te llevamos directamente a la tienda.
                    </p>
                </div>
            </div>

            {/* Product Grid */}
            <div className="max-w-[1600px] mx-auto px-4 md:px-8">
                <div className="flex items-end justify-between mb-8">
                    <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                        <span className="w-1 h-7 bg-primary block rounded-full"></span>
                        {activeCategory === 'Todos' ? 'Novedades Exclusivas' : activeCategory}
                    </h2>
                    <span className="text-gray-400 text-sm font-bold">{filteredProducts.length} productos</span>
                </div>

                {filteredProducts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-gray-500">
                        <span className="material-symbols-outlined text-6xl mb-4 text-gray-300">inventory_2</span>
                        <p className="text-lg font-bold">No hay productos en esta categoría</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {filteredProducts.map(product => (
                            <a key={product.id} href={product.url} target="_blank" rel="noopener noreferrer"
                               className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow flex flex-col">
                                <div className="relative aspect-[3/4] overflow-hidden bg-white">
                                    <img 
                                        src={product.image} 
                                        alt={product.name} 
                                        className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
                                    />
                                    
                                    {product.tag && (
                                        <div className={`absolute top-3 left-3 text-white text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded shadow ${
                                            product.tag === 'Premium' ? 'bg-gradient-to-r from-yellow-500 to-amber-600' :
                                            product.tag === 'Bestseller' ? 'bg-green-500' :
                                            product.tag === 'Nuevo' ? 'bg-blue-500' : 'bg-gray-500'
                                        }`}>
                                            {product.tag}
                                        </div>
                                    )}
                                </div>
                                
                                <div className="p-4 border-t border-gray-100 flex-1 flex flex-col">
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">{product.category}</p>
                                    <h3 className="text-sm font-bold text-gray-900 line-clamp-2 mb-3 min-h-[2.5rem] group-hover:text-primary transition-colors">{product.name}</h3>
                                    <div className="flex items-center justify-between gap-3 mt-auto">
                                        <span className="text-xl font-black text-primary">€{product.price.toFixed(2)}</span>
                                        <span className="bg-primary group-hover:bg-orange-600 text-white font-bold py-2.5 px-4 rounded-lg shadow-sm transition-colors flex items-center gap-1.5 text-xs">
                                            <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                                            Comprar
                                        </span>
                                    </div>
                                </div>
                            </a>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Store;
