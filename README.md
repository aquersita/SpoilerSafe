# 🛡️ SpoilerSafe - Detalles del Proyecto

**SpoilerSafe** es una plataforma diseñada para que la comunidad otaku comparta sus emociones sin arruinar la experiencia ajena. Transforma la visualización pasiva de anime en una experiencia social interactiva y protegida.

## 🎯 Objetivos del Proyecto

1.  **Protección Anti-Spoilers:** Crear un entorno seguro donde los usuarios puedan leer comentarios y reacciones sin miedo a descubrir tramas futuras accidentalmente.
2.  **Conexión Emocional:** Facilitar que los usuarios conecten con otros que están sintiendo lo mismo en el momento exacto del capítulo.
3.  **Gamificación Positiva:** Incentivar comportamientos que ayuden a la comunidad (reportar spoilers, comentar constructivamente) mediante un sistema de reputación y recompensas.
4.  **Patrimonio Emocional:** Permitir a los usuarios guardar sus "yo del pasado" mediante las Cápsulas del Tiempo.

---

## 🚀 Funcionalidades Clave

### 1. Sistema de Visibilidad "Spoiler Fog" 🌫️
El núcleo de la protección de SpoilerSafe.
*   **Funcionamiento:** Todo el contenido generado por la comunidad (comentarios, reacciones) asociado a un episodio que el usuario NO ha marcado como "Visto" aparece borroso o bloqueado por defecto.
*   **Desbloqueo:** Al marcar un episodio como "Visto", la niebla se disipa y el usuario gana acceso a la conversación.
*   **Seguridad:** Incluso dentro de un episodio visto, los comentarios marcados explícitamente como "Spoiler" (por el autor o por reportes) requieren un clic adicional para revelarse.

### 2. Comentarios Interactivos con Time-Sync ⏱️
*   **Contexto Temporal:** Los usuarios pueden adjuntar el **minuto y segundo exacto** del episodio a su comentario.
*   **Navegación:** Al hacer clic en el timestamp de un comentario (ej. `12:34`), el reproductor de video (o simulador) salta automáticamente a ese momento.
*   **Feedback:** Sistema de "Likes" ❤️ para destacar las mejores reacciones.

### 3. Gamificación: "The Guardian" 🛡️
Un sistema de rol que convierte a los usuarios en protectores de la comunidad.
*   **Puntos de Guardián:** Se ganan puntos realizando acciones positivas:
    *   **+10 puntos:** Por reportar correctamente un spoiler no marcado.
    *   **+5 puntos:** Por dejar un comentario (fomenta la actividad).
    *   **+2 puntos:** Por recibir un Like en un comentario (premio a la calidad).
*   **Niveles:** Los usuarios suben de nivel (ej. "Novato", "Guardián", "Héroe") acumulando puntos, desbloqueando insignias visuales en su perfil.
*   **Insignias (Badges):** Logros especiales como "Comentarista Novato" (primer comentario) o "Stalker Inicial" (seguir a alguien).

### 4. Cápsulas del Tiempo ⏳
Una funcionalidad única para preservar la "inocencia" del primer visionado.
*   **Concepto:** Durante los primeros 3 episodios de una serie, el usuario puede escribir sus teorías, predicciones o primeras impresiones y "enterrarlas".
*   **Bloqueo:** Estas cápsulas se bloquean criptográficamente (o lógicamente en la BD) y no se pueden abrir hasta que el usuario termine la serie completa.
*   **Revelación:** Al finalizar el anime, el usuario desbloquea sus cápsulas para ver qué tan acertadas (o equivocadas) estaban sus teorías iniciales.

### 5. Red Social Otaku 👥
*   **Perfiles de Usuario:** Página pública donde se muestran las estadísticas (Nivel, Puntos), las insignias desbloqueadas y el historial de actividad.
*   **Sistema de Seguimiento:** Los usuarios pueden seguirse mutuamente para ver qué están viendo o comentando sus amigos.

---

## 🛠️ Arquitectura Técnica

### Backend (API REST)
*   **Tecnología:** Python con **FastAPI**.
*   **Base de Datos:** SQLite (desarrollo) con **SQLAlchemy** como ORM.
*   **Autenticación:** Sistema robusto con **JWT (JSON Web Tokens)**. Soporta login opcional para lectura pública y protección estricta para escritura.
*   **Modelos de Datos:**
    *   `User`: Gestión de usuarios, contraseña hasheada, puntos y nivel.
    *   `Anime/Episode`: Información de las series (sincronizada con AniList).
    *   `Comment`: Relaciona usuario, episodio y tiempo.
    *   `TimeCapsule`: Almacena contenido bloqueado hasta condición de desbloqueo.
    *   `Badge/Report`: Tablas auxiliares para gamificación.

### Frontend (SPA)
*   **Tecnología:** **React** con Vite.
*   **Estilos:** **Tailwind CSS** para un diseño moderno y responsive "Mobile First".
*   **Estado:** Gestión de estado con Hooks (`useState`, `useEffect`) y React Router para navegación.
*   **Integración:** Cliente HTTP `Axios` para comunicación con la API.
*   **Componentes Clave:**
    *   `EpisodePlayer`: Reproductor simulado con lógica de sincronización de comentarios.
    *   `SpoilerFog`: Componente de alto orden (HOC) para proteger contenido sensible.
    *   `UserProfile`: Dashboard de gamificación.

### Integraciones Externas
*   **AniList API (GraphQL):** Se utiliza para obtener metadatos reales de anime (títulos, imágenes, sinopsis, número de episodios) y mantener la base de datos actualizada con las últimas tendencias.
