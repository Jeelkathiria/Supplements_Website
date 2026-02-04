import { apiFetch, apiCall } from './apiClient';

export interface OrderCancellationRequest {
  id: string;
  orderId: string;
  userId: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export class OrderCancellationService {
  // Create cancellation request
  static async createCancellationRequest(
    orderId: string,
    reason: string
  ): Promise<OrderCancellationRequest> {
    const letterCount = reason.trim().length;
    console.log("📨 Creating cancellation request:", { 
      orderId, 
      reasonLength: reason.length,
      reasonLetterCount: letterCount,
      reasonPreview: reason.substring(0, 50) + "..."
    });
    
    const response = await apiFetch('/order-cancellation-requests', {
      method: 'POST',
      body: JSON.stringify({
        orderId,
        reason,
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to create cancellation request';
      try {
        const error = await response.json();
        errorMessage = error.error || error.message || errorMessage;
        console.error("❌ API Error:", { status: response.status, errorMessage, fullError: error });
      } catch (e) {
        errorMessage = `Error ${response.status}: ${response.statusText}`;
        console.error("❌ API Error (no JSON):", { status: response.status, statusText: response.statusText });
      }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    return data.data;
  }

  // Get cancellation request for order
  static async getCancellationRequestByOrderId(
    orderId: string
  ): Promise<OrderCancellationRequest | null> {
    const response = await apiFetch(`/order-cancellation-requests/order/${orderId}`, {
      method: 'GET',
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch cancellation request');
    }

    const data = await response.json();
    return data.data;
  }

  // Get all pending cancellation requests (admin)
  static async getPendingRequests(): Promise<OrderCancellationRequest[]> {
    const response = await apiFetch('/order-cancellation-requests/admin/pending', {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch pending requests');
    }

    const data = await response.json();
    return data.data || [];
  }

  // Get all cancellation requests with filter (admin)
  static async getAllRequests(
    status?: 'PENDING' | 'APPROVED' | 'REJECTED'
  ): Promise<OrderCancellationRequest[]> {
    let endpoint = '/order-cancellation-requests/admin/all';
    if (status) {
      endpoint += `?status=${status}`;
    }

    const response = await apiFetch(endpoint, {
      method: 'GET',
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch requests');
    }

    const data = await response.json();
    return data.data || [];
  }

  // Approve cancellation request (admin)
  static async approveCancellation(requestId: string): Promise<OrderCancellationRequest> {
    const response = await apiFetch(
      `/order-cancellation-requests/${requestId}/approve`,
      {
        method: 'PATCH',
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to approve cancellation');
    }

    const data = await response.json();
    return data.data;
  }

  // Reject cancellation request (admin)
  static async rejectCancellation(requestId: string): Promise<OrderCancellationRequest> {
    const response = await apiFetch(
      `/order-cancellation-requests/${requestId}/reject`,
      {
        method: 'PATCH',
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to reject cancellation');
    }

    const data = await response.json();
    return data.data;
  }
}
