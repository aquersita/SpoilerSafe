import toast from 'react-hot-toast';

export const isAgeVerified = () =>
    localStorage.getItem('spoilersafe_age_verified') === 'true';

export const askAgeGate = (onConfirm) => {
    if (isAgeVerified()) {
        onConfirm();
        return;
    }

    toast.custom(
        (t) => (
            <div
                style={{ fontFamily: 'inherit' }}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 p-5 w-80"
            >
                <div className="flex items-start gap-3 mb-4">
                    <div className="shrink-0 w-11 h-11 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                        <span className="material-symbols-outlined text-red-500 text-2xl">18_up_rating</span>
                    </div>
                    <div>
                        <p className="font-black text-gray-900 dark:text-white text-sm leading-snug">
                            Contenido para adultos
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                            Este contenido está clasificado +18. ¿Confirmas que tienes 18 años o más?
                        </p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => {
                            localStorage.setItem('spoilersafe_age_verified', 'true');
                            toast.dismiss(t.id);
                            onConfirm();
                        }}
                        className="flex-1 bg-primary hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors"
                    >
                        Sí, tengo +18
                    </button>
                    <button
                        onClick={() => toast.dismiss(t.id)}
                        className="flex-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 font-bold py-2.5 rounded-xl text-sm transition-colors"
                    >
                        No
                    </button>
                </div>
            </div>
        ),
        { duration: Infinity, position: 'top-center' }
    );
};
