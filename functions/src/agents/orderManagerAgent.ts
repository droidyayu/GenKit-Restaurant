import {ai} from "../genkit";
import {createOrderTool, updateOrderStatusTool} from "../tools/orderTool";
import {inventoryTool} from "../tools/inventoryTool";

export async function orderManagerAgent(input: {
  userId: string;
  dish: string;
  quantity?: number;
  specialInstructions?: string;
}) {
  const {userId, dish, quantity = 1, specialInstructions} = input;
  console.log(`[ORDER MANAGER] Processing order for user ${userId}: ${quantity}x ${dish}`);

  try {
    // Get current inventory to check ingredient availability
    const inventory = await inventoryTool({});
    const availableIngredients = inventory.filter((item: any) =>
      item.available && item.quantity > 0
    );

    // Create ingredient list for AI validation
    const ingredientList = availableIngredients
      .map((item: any) => `${item.ingredient} (${item.quantity}${item.unit})`)
      .join(", ");

    // Use AI to validate if the dish can be made with available ingredients
    const {text} = await ai.generate({
      prompt: `
You are a kitchen manager at Indian Grill restaurant. 

Available ingredients: ${ingredientList}

Customer wants to order: ${quantity}x ${dish}${
  specialInstructions ? ` with special instructions: ${specialInstructions}` : ""
}

Please analyze if this dish can be made with the available ingredients and provide a response in this JSON format:

{
  "canMake": true/false,
  "reason": "Brief explanation",
  "missingIngredients": ["list of missing ingredients if any"],
  "suggestions": ["alternative dishes or modifications if needed"]
}

Consider:
- Whether the dish name is recognizable as an Indian dish
- If the required ingredients are available
- If modifications can be made with available ingredients
- What alternatives might be possible
`,
    });

    // Parse AI response
    let validation;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        validation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No valid JSON found in AI response");
      }
    } catch (parseError) {
      console.error("[ORDER MANAGER] Error parsing AI validation:", parseError);
      // Default to allowing the order if AI fails
      validation = {canMake: true, reason: "AI validation failed, proceeding with order"};
    }

    if (!validation.canMake) {
      return {
        success: false,
        error: "Dish not available",
        dish,
        reason: validation.reason,
        message: `Sorry, ${dish} is not available right now. ${validation.reason}`,
        suggestions: validation.suggestions || [],
      };
    }

    // Create order in system
    const orderResult = await createOrderTool({
      dishes: [{name: dish, quantity}],
      customerName: `User ${userId}`,
    });

    if (!orderResult.success) {
      return {
        success: false,
        error: "Failed to create order",
        dish,
        message: "Sorry, there was an error creating your order. Please try again.",
        details: orderResult.error || "Unknown error",
      };
    }

    // Update order status to pending
    await updateOrderStatusTool({
      status: "PENDING",
      message: "Order received and queued for cooking",
    });

    console.log(`[ORDER MANAGER] Order ${orderResult.orderId} created successfully`);

    // Return order confirmation
    return {
      success: true,
      action: "order_created",
      orderId: orderResult.orderId,
      userId,
      dish,
      quantity,
      status: "PENDING",
      message: `Order placed successfully! Your ${dish} will be ready in approximately 15-20 minutes.`,
      nextStep: "Order sent to Chef Agent for cooking",
      estimatedTime: "15-20 minutes",
      orderDetails: {
        orderId: orderResult.orderId,
        dish,
        quantity,
        specialInstructions: specialInstructions || "None",
        timestamp: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error(`[ORDER MANAGER] Error processing order for ${dish}:`, error);

    return {
      success: false,
      error: "Failed to process order",
      dish,
      details: error instanceof Error ? error.message : "Unknown error",
      message: "Sorry, there was an error processing your order. Please try again later.",
    };
  }
}

