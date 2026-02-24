// Define common types used by all coms adapters
export interface CommsMessage {
    id: string;
    sender: string;
    recipient: string;
    content: string;
    timestamp: Date;
}

export interface CommsResponse {
    success: boolean;
    message?: string;
    data?: any;
}
