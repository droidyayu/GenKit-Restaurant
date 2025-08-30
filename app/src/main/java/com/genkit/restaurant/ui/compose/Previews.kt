package com.genkit.restaurant.ui.compose

import androidx.compose.runtime.Composable
import androidx.compose.ui.tooling.preview.Preview
import com.genkit.restaurant.ui.theme.RestaurantChatTheme

@Preview(showBackground = true)
@Composable
fun UserIdScreenPreview() {
    RestaurantChatTheme {
        UserIdScreen(
            onNavigateToChat = {}
        )
    }
}

@Preview(showBackground = true)
@Composable
fun ChatScreenPreview() {
    RestaurantChatTheme {
        ChatScreen(
            onNavigateToUserId = {}
        )
    }
}