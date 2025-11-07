/**
 * Gestiona la conexión y la comunicación con el servidor WebSocket.
 */
export class WebSocketManager {
    constructor(url) {
        this.url = url;
        this.ws = null;
        this.messageHandlers = new Map();
        this.onOpen = null;
        this.isReady = false;
        this.messageQueue = [];
        this.heartbeatInterval = null;
        this.reconnectTimeout = null;
        this.reconnectAttempts = 0;
    }

    /**
     * Inicializa los manejadores de eventos del WebSocket y establece la conexión.
     */
    connect() {
        console.log(`Intentando conectar a WebSocket: ${this.url}`);
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
            console.log('✅ Conexión WebSocket establecida.');
            this.isReady = true;
            this.reconnectAttempts = 0;

            if (this.onOpen) this.onOpen();

            this.flushMessageQueue();
            this.startHeartbeat();
        };

        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            if (this.messageHandlers.has(message.type)) {
                this.messageHandlers.get(message.type)(message);
            } else {
                console.log('📨 Mensaje desconocido:', message.type);
            }
        };

        this.ws.onclose = (event) => {
            console.warn('⚠️ Conexión WebSocket cerrada.', event.reason || '');
            this.isReady = false;
            this.stopHeartbeat();
            this.scheduleReconnect();
        };

        this.ws.onerror = (error) => {
            console.error('❌ Error en WebSocket:', error.message || error);
            this.ws.close();
        };
    }

    /**
     * Envía un mensaje o lo encola si la conexión no está lista.
     */
    send(message) {
        if (this.isReady) {
            this.ws.send(JSON.stringify(message));
        } else {
            console.log('⏳ WebSocket no listo, encolando mensaje:', message);
            this.messageQueue.push(message);
        }
    }

    /**
     * Registra un callback para un tipo de mensaje específico.
     */
    onMessage(messageType, handler) {
        this.messageHandlers.set(messageType, handler);
    }

    /**
     * Procesa los mensajes pendientes una vez que la conexión se establece.
     */
    flushMessageQueue() {
        console.log(`🚀 Procesando ${this.messageQueue.length} mensajes encolados.`);
        while (this.messageQueue.length > 0) {
            const message = this.messageQueue.shift();
            this.send(message);
        }
    }

    /**
     * Envía "pings" periódicos para mantener viva la conexión en Azure.
     */
    startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatInterval = setInterval(() => {
            if (this.ws && this.ws.readyState === WebSocket.OPEN) {
                try {
                    this.ws.send(JSON.stringify({ type: '__ping__', ts: Date.now() }));
                    // console.log('💓 Ping enviado al servidor.');
                } catch (e) {
                    console.warn('❗ Error enviando ping:', e);
                }
            }
        }, 20000); // cada 20 segundos
    }

    stopHeartbeat() {
        if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
    }

    /**
     * Intenta reconectarse con backoff exponencial.
     */
    scheduleReconnect() {
        if (this.reconnectTimeout) return;
        const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 15000);
        console.log(`🔄 Intentando reconectar en ${delay / 1000}s...`);
        this.reconnectAttempts++;

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.connect();
        }, delay);
    }
}
