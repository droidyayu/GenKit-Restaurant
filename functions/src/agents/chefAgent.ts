import { ai } from '../genkit';
import { inventoryTool, updateOrderStatusTool } from '../tools/index';

export async function chefAgent(input: {
  orderId: string;
  dishName: string;
  userId: string;
  specialInstructions?: string;
}) {
  const { orderId, dishName, userId, specialInstructions } = input;
  console.log(`[CHEF AGENT] Starting cooking for order ${orderId}: ${dishName}`);
  
  try {
    // Get current inventory to check ingredient availability
    const inventory = await inventoryTool({});
    const availableIngredients = inventory.filter((item: any) => 
      item.available && item.quantity > 0
    );
    
    // Create ingredient list for AI validation
    const ingredientList = availableIngredients.map((item: any) => `${item.ingredient} (${item.quantity}${item.unit})`).join(', ');
    
    // Use AI to validate if the dish can be cooked with available ingredients
    const { text } = await ai.generate({
      prompt: `
You are a master chef at Indian Grill restaurant. 

Available ingredients: ${ingredientList}

Need to cook: ${dishName}${specialInstructions ? ` with special instructions: ${specialInstructions}` : ''}

Please analyze if this dish can be cooked with the available ingredients and provide a response in this JSON format:

{
  "canCook": true/false,
  "reason": "Brief explanation",
  "missingIngredients": ["list of missing ingredients if any"],
  "cookingSteps": ["brief cooking steps if possible"],
  "estimatedTime": "estimated cooking time in minutes"
}

Consider:
- Whether the dish name is recognizable as an Indian dish
- If the required ingredients are available
- What cooking steps would be involved
- How long it would take to prepare
`
    });
    
    // Parse AI response
    let validation;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        validation = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No valid JSON found in AI response');
      }
    } catch (parseError) {
      console.error('[CHEF AGENT] Error parsing AI validation:', parseError);
      // Default to allowing cooking if AI fails
      validation = { 
        canCook: true, 
        reason: 'AI validation failed, proceeding with cooking',
        estimatedTime: 15
      };
    }
    
    if (!validation.canCook) {
      return {
        success: false,
        orderId,
        dishName,
        userId,
        error: 'Insufficient ingredients',
        reason: validation.reason,
        missingIngredients: validation.missingIngredients || [],
        message: `Sorry, I cannot cook ${dishName} due to missing ingredients.`
      };
    }
    
    // Update order status to cooking
    await updateOrderStatusTool({
      status: 'COOKING',
      message: `Chef is now cooking your ${dishName}`
    });
    
    console.log(`[CHEF AGENT] Order ${orderId} status updated to cooking`);
    
    // Simulate cooking with accelerated time (1 second = 1 minute)
    console.log(`[CHEF AGENT] Starting cooking simulation for ${dishName}`);
    
    // Simulate cooking phases
    const cookingPhases = [
      { phase: 'Prep', duration: 2, message: 'Preparing ingredients and spices' },
      { phase: 'Cooking', duration: 8, message: 'Cooking the main dish' },
      { phase: 'Garnishing', duration: 3, message: 'Adding final touches and garnishes' },
      { phase: 'Plating', duration: 2, message: 'Plating the dish beautifully' }
    ];
    
    let totalCookTime = 0;
    const phases = [];
    
    for (const phase of cookingPhases) {
      console.log(`[CHEF AGENT] ${phase.phase} phase: ${phase.message}`);
      // Simulate time passing (accelerated: 1 second = 1 minute)
      await new Promise(resolve => setTimeout(resolve, phase.duration * 1000));
      totalCookTime += phase.duration;
      phases.push({ phase: phase.phase, duration: phase.duration, message: phase.message });
    }
    
    console.log(`[CHEF AGENT] Cooking completed in ${totalCookTime} minutes (simulated)`);
    
    // Update order status to ready
    await updateOrderStatusTool({
      status: 'READY',
      message: `Your ${dishName} is ready for delivery!`
    });
    
    console.log(`[CHEF AGENT] Order ${orderId} completed successfully`);
    
          // Return cooking completion
      return {
        success: true,
        orderId,
        dishName,
        userId,
        action: 'cooking_completed',
        status: 'ready',
        totalCookTime: totalCookTime,
        phases: phases,
        message: `Successfully cooked ${dishName} in ${totalCookTime} minutes`,
        nextStep: 'Order ready for delivery by Waiter Agent',
        timestamp: new Date().toISOString()
      };
    
  } catch (error) {
    console.error(`[CHEF AGENT] Error cooking ${dishName}:`, error);
    
    return {
      success: false,
      orderId,
      dishName,
      userId,
      error: 'Cooking process failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      message: `Sorry, there was an error cooking your ${dishName}. Please try again later.`
    };
  }
}

