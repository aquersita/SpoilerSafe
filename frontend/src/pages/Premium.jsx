import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
const Premium = () => {
    const navigate = useNavigate();
    const { firebaseUser, profile: user, setProfile } = useAuth();
    const [showCheckout, setShowCheckout] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Formulario Fake Stripe
    const [cardName, setCardName] = useState('');
    const [cardNumber, setCardNumber] = useState('');
    const [expiry, setExpiry] = useState('');
    const [cvc, setCvc] = useState('');

    useEffect(() => {
        if (user?.is_premium) {
            // Already premium, maybe show a different view
        }
    }, [user]);

    const handleSubscribe = () => {
        if (!user) {
            toast.error("Debes iniciar sesión para suscribirte.");
            navigate('/login');
            return;
        }
        if (user.is_premium) {
            toast.success("¡Ya eres miembro Premium!");
            return;
        }
        setShowCheckout(true);
    };

    const processPayment = async (e) => {
        e.preventDefault();
        if (!cardName || cardNumber.length < 15 || !expiry || !cvc) {
            toast.error("Por favor, rellena los datos de la tarjeta correctamente.");
            return;
        }

        setIsProcessing(true);

        // Simulate payment gateway delay
        setTimeout(async () => {
            try {
                await updateDoc(doc(db, 'users', firebaseUser.uid), { is_premium: true });
                setProfile(prev => ({ ...prev, is_premium: true }));
                setIsProcessing(false);
                setIsSuccess(true);
                toast.success("¡Pago procesado con éxito!");
                setTimeout(() => { window.location.href = '/'; }, 3000);
            } catch (err) {
                setIsProcessing(false);
                toast.error("Error al procesar el pago. Inténtalo de nuevo.");
            }
        }, 2000);
    };

    const formatCardNumber = (e) => {
        const val = e.target.value.replace(/\D/g, '').match(/.{1,4}/g);
        setCardNumber(val ? val.join(' ') : '');
    };

    const formatExpiry = (e) => {
        let val = e.target.value.replace(/\D/g, '');
        if (val.length >= 3) {
            val = val.slice(0, 2) + '/' + val.slice(2, 4);
        }
        setExpiry(val);
    };

    return (
        <div className="min-h-screen bg-background-light py-12 px-4 sm:px-6 lg:px-8 font-display relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-orange-100 to-transparent opacity-50 pointer-events-none"></div>
            <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary rounded-full blur-3xl opacity-10 pointer-events-none"></div>
            
            <div className="max-w-7xl mx-auto relative z-10">
                <div className="text-center mb-16 animate-fade-in-up">
                    <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 tracking-tight">
                        Eleva tu experiencia Anime al <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-yellow-500">Nivel Dios</span>
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        Únete a SpoilerSafe Premium y disfruta de tu pasión sin límites, sin anuncios y con ventajas explosivas en la comunidad.
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* Plan Gratuito */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 transform transition duration-500 hover:-translate-y-2 opacity-90">
                        <h3 className="text-2xl font-bold text-slate-400 mb-2">Plan Base</h3>
                        <div className="text-4xl font-black text-slate-900 mb-6">Gratis <span className="text-lg text-slate-500 font-normal">/para siempre</span></div>
                        
                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center text-slate-600">
                                <span className="material-symbols-outlined text-green-500 mr-3">check_circle</span>
                                Acceso al catálogo completo
                            </li>
                            <li className="flex items-center text-slate-600">
                                <span className="material-symbols-outlined text-green-500 mr-3">check_circle</span>
                                Comentarios y comunidad
                            </li>
                            <li className="flex items-center text-slate-600">
                                <span className="material-symbols-outlined text-green-500 mr-3">check_circle</span>
                                Calidad 1080p
                            </li>
                            <li className="flex items-center text-slate-400">
                                <span className="material-symbols-outlined mr-3">cancel</span>
                                Contiene Anuncios
                            </li>
                            <li className="flex items-center text-slate-400">
                                <span className="material-symbols-outlined mr-3">cancel</span>
                                Sin descargas offline
                            </li>
                        </ul>
                        <button className="w-full py-4 rounded-xl font-bold text-slate-500 bg-slate-100 cursor-not-allowed">
                            Tu plan actual
                        </button>
                    </div>

                    {/* Plan Premium */}
                    <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-8 shadow-2xl border border-slate-700 transform transition duration-500 hover:-translate-y-2 relative overflow-hidden">
                        <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-400 to-yellow-500 text-white text-xs font-bold px-4 py-1 rounded-bl-lg uppercase tracking-wider">
                            Más Popular
                        </div>
                        <h3 className="text-2xl font-bold text-orange-400 mb-2 flex items-center gap-2">
                            <span className="material-symbols-outlined">diamond</span> Premium
                        </h3>
                        <div className="text-5xl font-black text-white mb-6">€4.99 <span className="text-lg text-slate-400 font-normal">/mes</span></div>
                        
                        <ul className="space-y-4 mb-8">
                            <li className="flex items-center text-slate-300">
                                <span className="material-symbols-outlined text-orange-400 mr-3">check_circle</span>
                                <strong className="text-white mr-1">Cero Anuncios.</strong> Visualización ininterrumpida.
                            </li>
                            <li className="flex items-center text-slate-300">
                                <span className="material-symbols-outlined text-orange-400 mr-3">check_circle</span>
                                <strong className="text-white mr-1">Calidad 4K HDR.</strong> Los colores vibran.
                            </li>
                            <li className="flex items-center text-slate-300">
                                <span className="material-symbols-outlined text-orange-400 mr-3">check_circle</span>
                                <strong className="text-white mr-1">Descargas Offline.</strong> Míralo en el avión.
                            </li>
                            <li className="flex items-center text-slate-300">
                                <span className="material-symbols-outlined text-orange-400 mr-3">check_circle</span>
                                <strong className="text-white mr-1">Medalla Exclusiva VIP</strong> en tu perfil.
                            </li>
                            <li className="flex items-center text-slate-300">
                                <span className="material-symbols-outlined text-orange-400 mr-3">check_circle</span>
                                <strong className="text-white mr-1">Skip Intro Automático.</strong> Directo a la acción.
                            </li>
                        </ul>
                        
                        {user?.is_premium ? (
                            <button className="w-full py-4 rounded-xl font-bold text-white bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg flex justify-center items-center gap-2 cursor-default">
                                <span className="material-symbols-outlined">verified</span> ¡Suscripción Activa!
                            </button>
                        ) : (
                            <button 
                                onClick={handleSubscribe}
                                className="w-full py-4 rounded-xl font-bold text-slate-900 bg-gradient-to-r from-orange-400 to-yellow-500 hover:from-orange-500 hover:to-yellow-600 shadow-lg shadow-orange-500/30 transition-all transform hover:scale-105 active:scale-95"
                            >
                                Pagar con Tarjeta Segura
                            </button>
                        )}
                        <p className="text-center text-slate-500 text-sm mt-4">Cancela en cualquier momento.</p>
                    </div>
                </div>
            </div>

            {/* Modal de Checkout tipo Stripe */}
            {showCheckout && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden relative">
                        
                        {/* Botón Cerrar */}
                        {!isProcessing && !isSuccess && (
                            <button onClick={() => setShowCheckout(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 z-10">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        )}

                        {isSuccess ? (
                            <div className="p-10 text-center animate-fade-in-up">
                                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <span className="material-symbols-outlined text-green-500 text-6xl">check_circle</span>
                                </div>
                                <h2 className="text-3xl font-black text-slate-900 mb-2">¡Pago Completado!</h2>
                                <p className="text-slate-600 mb-6">Bienvenido al club Premium. Redirigiendo a tu perfil...</p>
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-green-500 h-full animate-[progress_3s_ease-in-out_forwards]"></div>
                                </div>
                            </div>
                        ) : (
                            <div className="p-8">
                                <div className="flex items-center gap-3 mb-8 border-b border-slate-100 pb-6">
                                    <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center">
                                        <span className="material-symbols-outlined text-orange-500">diamond</span>
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900">SpoilerSafe Premium</h2>
                                        <p className="text-slate-500 font-medium">€4.99 / mes</p>
                                    </div>
                                </div>

                                <form onSubmit={processPayment} className="space-y-5">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Datos de la Tarjeta</label>
                                        <div className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-all">
                                            <div className="p-3 border-b border-slate-200 flex items-center gap-2 relative">
                                                <span className="material-symbols-outlined text-slate-400 text-xl">credit_card</span>
                                                <input 
                                                    type="text" 
                                                    className="w-full bg-transparent outline-none text-slate-900 font-medium placeholder-slate-400"
                                                    placeholder="Número de tarjeta"
                                                    value={cardNumber}
                                                    onChange={formatCardNumber}
                                                    maxLength="19"
                                                    required
                                                    disabled={isProcessing}
                                                />
                                            </div>
                                            <div className="flex">
                                                <div className="p-3 border-r border-slate-200 w-1/2">
                                                    <input 
                                                        type="text" 
                                                        className="w-full bg-transparent outline-none text-slate-900 font-medium placeholder-slate-400"
                                                        placeholder="MM / YY"
                                                        value={expiry}
                                                        onChange={formatExpiry}
                                                        maxLength="5"
                                                        required
                                                        disabled={isProcessing}
                                                    />
                                                </div>
                                                <div className="p-3 w-1/2 flex items-center gap-2">
                                                    <input 
                                                        type="text" 
                                                        className="w-full bg-transparent outline-none text-slate-900 font-medium placeholder-slate-400"
                                                        placeholder="CVC"
                                                        value={cvc}
                                                        onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
                                                        maxLength="4"
                                                        required
                                                        disabled={isProcessing}
                                                    />
                                                    <span className="material-symbols-outlined text-slate-400 text-lg">credit_card</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 block">Nombre en la Tarjeta</label>
                                        <input 
                                            type="text" 
                                            className="w-full p-3 border border-slate-200 rounded-lg bg-slate-50 text-slate-900 font-medium outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
                                            placeholder="John Doe"
                                            value={cardName}
                                            onChange={(e) => setCardName(e.target.value)}
                                            required
                                            disabled={isProcessing}
                                        />
                                    </div>

                                    <button 
                                        type="submit"
                                        disabled={isProcessing}
                                        className={`w-full py-4 rounded-xl font-bold flex justify-center items-center gap-2 transition-all shadow-lg
                                            ${isProcessing ? 'bg-slate-200 text-slate-500 cursor-not-allowed hidden' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-900/20 active:scale-95'}`}
                                    >
                                        <span className="material-symbols-outlined text-lg">lock</span>
                                        Pagar €4.99
                                    </button>
                                    
                                    {/* Boton Processing loader animado interactivo */}
                                    {isProcessing && (
                                         <button 
                                            disabled
                                            className="w-full py-4 rounded-xl font-bold flex justify-center items-center gap-3 bg-slate-900 text-white opacity-90 cursor-wait shadow-lg shadow-slate-900/20"
                                         >
                                             <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                             Procesando pago seguro...
                                         </button>
                                    )}

                                    <div className="flex items-center justify-center gap-1 text-slate-400 text-xs font-medium">
                                        <span className="material-symbols-outlined text-sm">enhanced_encryption</span>
                                        Pagos protegidos por MockStripe de 256-bits
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                </div>
            )}
            
        </div>
    );
};

export default Premium;