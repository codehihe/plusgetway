import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

interface WebSocketClient extends WebSocket {
  reference?: string;
}

export const setupWebSocketServer = (server: Server) => {
  const wss = new WebSocketServer({ server, path: '/ws' });
  const clients = new Map<string, Set<WebSocketClient>>();

  wss.on('connection', (ws: WebSocketClient) => {
    console.log('New WebSocket connection established');

    ws.on('message', (message: string) => {
      try {
        const data = JSON.parse(message.toString());

        if (data.type === 'subscribe' && data.reference) {
          ws.reference = data.reference;
          if (!clients.has(data.reference)) {
            clients.set(data.reference, new Set());
          }
          clients.get(data.reference)?.add(ws);
          console.log(`Client subscribed to reference: ${data.reference}`);
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'error',
            message: 'Invalid message format'
          }));
        }
      }
    });

    ws.on('close', () => {
      if (ws.reference) {
        const clientSet = clients.get(ws.reference);
        if (clientSet) {
          clientSet.delete(ws);
          if (clientSet.size === 0) {
            clients.delete(ws.reference);
          }
          console.log(`Client unsubscribed from reference: ${ws.reference}`);
        }
      }
    });

    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'error',
          message: 'Internal server error'
        }));
      }
    });

    // Send initial connection success message
    ws.send(JSON.stringify({
      type: 'connected',
      message: 'Successfully connected to payment server'
    }));
  });

  const broadcastPaymentUpdate = (reference: string, status: 'success' | 'failed') => {
    const clientSet = clients.get(reference);
    if (clientSet) {
      const message = JSON.stringify({
        type: 'payment_status',
        reference,
        status,
        timestamp: new Date().toISOString()
      });

      let activeClients = 0;
      clientSet.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
          activeClients++;
        }
      });
      console.log(`Payment status broadcast to ${activeClients} clients for reference: ${reference}`);
    }
  };

  return { broadcastPaymentUpdate };
};

export type WebSocketServer = ReturnType<typeof setupWebSocketServer>;