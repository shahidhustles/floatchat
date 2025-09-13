// Mock WebSocket data for real-time float updates
export interface FloatUpdate {
  id: string;
  temperature: number;
  salinity: number;
  depth: number;
  status: "active" | "inactive" | "maintenance";
  lastTransmission: string;
  coordinates: [number, number];
}

export interface WebSocketMessage {
  type: "float_update" | "batch_update" | "status_change";
  data: FloatUpdate | FloatUpdate[];
  timestamp: string;
}

export class MockFloatDataStream {
  private ws: WebSocket | null = null;
  private reconnectInterval: number = 5000;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private subscribers: Set<(data: WebSocketMessage) => void> = new Set();
  private isConnected: boolean = false;

  constructor(private url: string = "ws://localhost:3001/float-stream") {}

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // For demo purposes, we'll simulate WebSocket connection
        // In production, this would connect to actual ARGO data streams
        this.simulateConnection();
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  private simulateConnection(): void {
    this.isConnected = true;
    console.log("🌊 Connected to ARGO Float Data Stream");

    // Simulate periodic float updates every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      this.simulateFloatUpdate();
    }, 30000);

    // Simulate initial batch update
    setTimeout(() => {
      this.simulateBatchUpdate();
    }, 2000);
  }

  private simulateFloatUpdate(): void {
    if (!this.isConnected) return;

    // Generate random float update
    const floatIds = [
      "ARGO_5904567",
      "ARGO_5905123",
      "ARGO_5905678",
      "ARGO_5904890",
      "ARGO_5905234",
      "ARGO_5904123",
      "ARGO_5905445",
      "ARGO_5904778",
    ];

    const randomFloat = floatIds[Math.floor(Math.random() * floatIds.length)];

    const update: FloatUpdate = {
      id: randomFloat,
      temperature: Math.round((Math.random() * 15 + 20) * 10) / 10, // 20-35°C
      salinity: Math.round((Math.random() * 5 + 33) * 10) / 10, // 33-38 PSU
      depth: Math.floor(Math.random() * 1500 + 500), // 500-2000m
      status:
        Math.random() > 0.1
          ? "active"
          : Math.random() > 0.5
          ? "maintenance"
          : "inactive",
      lastTransmission: new Date().toISOString(),
      coordinates: [
        Math.random() * 30 + 60, // 60-90°E longitude
        Math.random() * 40 - 20, // -20 to 20°N latitude
      ],
    };

    const message: WebSocketMessage = {
      type: "float_update",
      data: update,
      timestamp: new Date().toISOString(),
    };

    this.notifySubscribers(message);
  }

  private simulateBatchUpdate(): void {
    if (!this.isConnected) return;

    // Simulate batch update of multiple floats
    const updates: FloatUpdate[] = [];
    const batchSize = Math.floor(Math.random() * 5) + 3; // 3-7 floats

    for (let i = 0; i < batchSize; i++) {
      updates.push({
        id: `ARGO_${Math.floor(Math.random() * 900000) + 100000}`,
        temperature: Math.round((Math.random() * 15 + 20) * 10) / 10,
        salinity: Math.round((Math.random() * 5 + 33) * 10) / 10,
        depth: Math.floor(Math.random() * 1500 + 500),
        status: "active",
        lastTransmission: new Date().toISOString(),
        coordinates: [Math.random() * 30 + 60, Math.random() * 40 - 20],
      });
    }

    const message: WebSocketMessage = {
      type: "batch_update",
      data: updates,
      timestamp: new Date().toISOString(),
    };

    this.notifySubscribers(message);
  }

  subscribe(callback: (data: WebSocketMessage) => void): void {
    this.subscribers.add(callback);
  }

  unsubscribe(callback: (data: WebSocketMessage) => void): void {
    this.subscribers.delete(callback);
  }

  private notifySubscribers(message: WebSocketMessage): void {
    this.subscribers.forEach((callback) => {
      try {
        callback(message);
      } catch (error) {
        console.error("Error in WebSocket subscriber:", error);
      }
    });
  }

  disconnect(): void {
    this.isConnected = false;

    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    console.log("🔌 Disconnected from ARGO Float Data Stream");
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  // Simulate real-time alerts for critical conditions
  simulateCriticalAlert(): void {
    const alertUpdate: FloatUpdate = {
      id: "ARGO_CRITICAL_001",
      temperature: 35.5, // High temperature alert
      salinity: 40.2, // High salinity alert
      depth: 50, // Shallow depth - potential surface issue
      status: "maintenance",
      lastTransmission: new Date().toISOString(),
      coordinates: [73.5, 18.9], // Near Mumbai coast
    };

    const message: WebSocketMessage = {
      type: "status_change",
      data: alertUpdate,
      timestamp: new Date().toISOString(),
    };

    this.notifySubscribers(message);
  }
}

// Singleton instance for app-wide usage
export const floatDataStream = new MockFloatDataStream();
