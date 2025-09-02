import {getOrderStatusTool, updateOrderStatusTool, completeOrderTool} from "../tools/orderTool";
import {notificationTool} from "../tools/notificationTool";

import {menuRecipeAgent} from "./menuRecipeAgent";

export async function waiterAgent(input: {
  userId: string;
  orderId?: string;
  action: "checkStatus" | "deliverOrder" | "upsellDessert" | "generalInquiry";
  message?: string;
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }>;
}) {
  const {userId, orderId, action, message, conversationHistory} = input;
  console.log(`[WAITER AGENT] Processing ${action} for user ${userId}`);

  try {
    switch (action) {
    case "checkStatus":
      return await handleStatusCheck(userId, orderId, conversationHistory);

    case "deliverOrder":
      return await handleOrderDelivery(userId, orderId!, conversationHistory);

    case "upsellDessert":
      return await handleDessertUpsell(userId, orderId, conversationHistory);

    case "generalInquiry":
      return await handleGeneralInquiry(userId, message, conversationHistory);

    default:
      return {
        success: false,
        error: "Invalid action",
        message: "Please specify a valid action: checkStatus, deliverOrder, upsellDessert, or generalInquiry",
      };
    }
  } catch (error) {
    console.error(`[WAITER AGENT] Error processing ${action}:`, error);

    return {
      success: false,
      error: `Failed to process ${action}`,
      details: error instanceof Error ? error.message : "Unknown error",
      message: "Sorry, there was an error processing your request. Please try again later.",
    };
  }
}

// Handle order status check
async function handleStatusCheck(
  userId: string,
  orderId?: string,
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }>
) {
  console.log(`[WAITER AGENT] Checking status for user ${userId}, order ${orderId || "current"}`);

  const status = await getOrderStatusTool({orderId});

  if (status.status === "NO_ACTIVE_ORDER") {
    return {
      success: true,
      action: "checkStatus",
      userId,
      message: "You have no active orders at the moment. Would you like to see our menu or place an order?",
      status: "no_orders",
      suggestions: [
        "Show me the menu",
        "I want to order something",
        "What's available today?",
      ],
    };
  }

  // Format status message based on current status
  let statusMessage = "";
  let nextStep = "";

  switch (status.status) {
  case "PENDING":
    statusMessage = "Your order has been received and is queued for cooking.";
    nextStep = "Chef will start cooking soon.";
    break;
  case "PREP":
    statusMessage = "Chef is preparing your ingredients.";
    nextStep = "Cooking will begin shortly.";
    break;
  case "COOKING":
    statusMessage = "Chef is actively cooking your order.";
    nextStep = "Your food will be ready in about 10-15 minutes.";
    break;
  case "PLATING":
    statusMessage = "Your order is being plated and garnished.";
    nextStep = "Almost ready!";
    break;
  case "READY":
    statusMessage = "Your order is ready for delivery!";
    nextStep = "I'll deliver it to you right away.";
    break;
  case "DELIVERED":
    statusMessage = "Your order has been delivered. Enjoy your meal!";
    nextStep = "Would you like to try one of our desserts?";
    break;
  default:
    statusMessage = "Your order is being processed.";
    nextStep = "Please wait while we prepare your food.";
  }

  return {
    success: true,
    action: "checkStatus",
    userId,
    orderId: status.orderId,
    status: status.status,
    message: statusMessage,
    nextStep,
    estimatedTime: status.estimatedTime,
    progress: status.progress,
    dishes: status.dishes,
  };
}

// Handle order delivery
async function handleOrderDelivery(
  userId: string,
  orderId: string,
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }>
) {
  console.log(`[WAITER AGENT] Delivering order ${orderId} to user ${userId}`);

  // First check if order is ready
  const status = await getOrderStatusTool({orderId});

  if (status.status !== "READY") {
    return {
      success: false,
      action: "deliverOrder",
      userId,
      orderId,
      error: "Order not ready",
      message: `Your order is not ready yet. Current status: ${status.status}`,
      currentStatus: status.status,
    };
  }

  // Simulate delivery process
  console.log(`[WAITER AGENT] Delivering order ${orderId} to user ${userId}`);

  // Simulate delivery time (accelerated: 1 second = 1 minute)
  await new Promise((resolve) => setTimeout(resolve, 2000)); // 2 seconds = 2 minutes

  // Update order status to delivered
  await updateOrderStatusTool({
    status: "DELIVERED",
    message: "Order delivered successfully",
  });

  // Complete the order
  await completeOrderTool({});

  console.log(`[WAITER AGENT] Order ${orderId} delivered successfully`);

  return {
    success: true,
    action: "deliverOrder",
    userId,
    orderId,
    status: "delivered",
    message: "Your order has been delivered successfully! Enjoy your meal.",
    deliveryDetails: {
      deliveryTime: "2 minutes",
      method: "Table service",
      status: "completed",
    },
    nextStep: "Consider trying one of our desserts to complete your meal!",
  };
}

// Handle dessert upsell
async function handleDessertUpsell(
  userId: string,
  orderId?: string,
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }>
) {
  console.log(`[WAITER AGENT] Suggesting desserts to user ${userId}`);

  // Get dessert suggestions from Menu & Recipe Agent
  const dessertResult = await menuRecipeAgent({
    userId,
    requestType: "dessert_upsell",
    conversationHistory, // Pass conversation history
  });

  if (dessertResult.success) {
    // Send dessert notification
    const notification = await notificationTool({
      userId,
      title: "Dessert Time! 🍰",
      body: "Would you like to try one of our delicious desserts?",
      data: {
        type: "dessert_upsell",
        suggestions: dessertResult.menuDisplay || "Various desserts available",
        timestamp: new Date().toISOString(),
      },
      priority: "normal",
    });

    return {
      success: true,
      action: "upsellDessert",
      userId,
      orderId,
      message: dessertResult.message,
      dessertMenu: dessertResult.menuDisplay,
      totalAvailable: dessertResult.totalAvailable,
      notificationSent: notification.success,
      note: dessertResult.note,
    };
  } else {
    return {
      success: false,
      action: "upsellDessert",
      userId,
      orderId,
      error: "No desserts available",
      message: dessertResult.message || "Sorry, no desserts are available right now.",
    };
  }
}

// Handle general inquiries
async function handleGeneralInquiry(
  userId: string,
  message?: string,
  conversationHistory?: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    metadata?: Record<string, any>;
  }>
) {
  console.log(`[WAITER AGENT] Handling general inquiry from user ${userId}: "${message}"`);

  if (!message) {
    return {
      success: false,
      action: "generalInquiry",
      userId,
      error: "No message provided",
      message: "Please provide a message for your inquiry.",
    };
  }

  // Simple keyword-based responses
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("menu") ||
      (lowerMessage.includes("what") && lowerMessage.includes("serve"))) {
    return {
      success: true,
      action: "generalInquiry",
      userId,
      message: "I'd be happy to show you our menu! Let me get that for you.",
      nextStep: "Ask about our menu to see available dishes.",
      suggestions: [
        "Show me the menu",
        "What dishes can you make?",
        "What's available today?",
      ],
    };
  }

  if (lowerMessage.includes("hours") || lowerMessage.includes("open") || lowerMessage.includes("time")) {
    return {
      success: true,
      action: "generalInquiry",
      userId,
      message: "We're open daily from 11:00 AM to 10:00 PM. " +
        "We serve lunch and dinner with our full menu available throughout the day.",
      hours: "11:00 AM - 10:00 PM (Daily)",
      note: "Last orders accepted at 9:30 PM",
    };
  }

  if (lowerMessage.includes("delivery") || lowerMessage.includes("takeout") || lowerMessage.includes("pickup")) {
    return {
      success: true,
      action: "generalInquiry",
      userId,
      message: "We offer both dine-in and takeout services. " +
        "For takeout, you can place your order and pick it up when ready. " +
        "We also offer delivery through our partner services.",
      services: ["Dine-in", "Takeout", "Delivery"],
      note: "Delivery available through partner services",
    };
  }

  // Default response for unrecognized inquiries
  return {
    success: true,
    action: "generalInquiry",
    userId,
    message: "I'm here to help! I can assist you with menu information, order placement, " +
        "status checks, and general questions about our restaurant.",
    capabilities: [
      "Menu and recommendations",
      "Order placement and tracking",
      "Restaurant information",
      "General assistance",
    ],
    suggestions: [
      "Ask about our menu",
      "Place an order",
      "Check order status",
      "Ask about hours or services",
    ],
  };
}
