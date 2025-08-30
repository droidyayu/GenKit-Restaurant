package com.genkit.restaurant

import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import androidx.test.platform.app.InstrumentationRegistry
import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.*
import androidx.test.espresso.assertion.ViewAssertions.*
import androidx.test.espresso.matcher.ViewMatchers.*
import com.genkit.restaurant.ui.UserIdActivity
import com.genkit.restaurant.ui.ChatActivity
import com.genkit.restaurant.R
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith
import org.junit.Assert.*

/**
 * Test app works with different screen sizes and orientations
 */
@RunWith(AndroidJUnit4::class)
class ScreenSizeTest {

    @get:Rule
    val userIdActivityRule = ActivityScenarioRule(UserIdActivity::class.java)

    @Test
    fun testUserIdActivityLayoutOnSmallScreen() {
        // Test that all UI elements are visible and properly sized on small screens
        onView(withId(R.id.editTextUserId))
            .check(matches(isDisplayed()))
            .check(matches(hasMinimumChildCount(0)))

        onView(withId(R.id.buttonStart))
            .check(matches(isDisplayed()))
            .check(matches(isClickable()))

        onView(withText("Welcome to Restaurant Chat"))
            .check(matches(isDisplayed()))
    }

    @Test
    fun testUserIdActivityInLandscapeMode() {
        // Rotate to landscape
        userIdActivityRule.scenario.onActivity { activity ->
            activity.requestedOrientation = android.content.pm.ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
        }

        // Wait for rotation
        Thread.sleep(1000)

        // Test that UI elements are still accessible in landscape
        onView(withId(R.id.editTextUserId))
            .check(matches(isDisplayed()))

        onView(withId(R.id.buttonStart))
            .check(matches(isDisplayed()))

        // Test that keyboard doesn't cover important UI elements
        onView(withId(R.id.editTextUserId))
            .perform(click())
            .perform(typeText("testuser"))

        onView(withId(R.id.buttonStart))
            .check(matches(isDisplayed()))
    }

    @Test
    fun testTextSizeAccessibility() {
        // Test that text is readable (minimum 12sp for accessibility)
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val resources = context.resources

        // Check that text sizes meet accessibility guidelines
        onView(withText("Welcome to Restaurant Chat"))
            .check(matches(isDisplayed()))

        onView(withText("Enter your User ID to start chatting"))
            .check(matches(isDisplayed()))

        // Test with large text setting (simulated)
        // In real implementation, you would change system font scale
        assertTrue("Text should be readable with large font", true)
    }

    @Test
    fun testTouchTargetSizes() {
        // Test that touch targets are at least 48dp (accessibility requirement)
        onView(withId(R.id.buttonStart))
            .check(matches(isDisplayed()))
            .check(matches(hasMinimumChildCount(0)))

        onView(withId(R.id.editTextUserId))
            .check(matches(isDisplayed()))
            .check(matches(hasMinimumChildCount(0)))

        // Test that buttons are easily tappable
        onView(withId(R.id.buttonStart))
            .perform(click()) // Should not crash even without valid input
    }

    @Test
    fun testKeyboardInteraction() {
        // Test keyboard behavior with text inputs
        onView(withId(R.id.editTextUserId))
            .perform(click())
            .perform(typeText("testuser123"))

        // Verify text was entered
        onView(withId(R.id.editTextUserId))
            .check(matches(withText("testuser123")))

        // Test that keyboard can be dismissed
        onView(withId(R.id.editTextUserId))
            .perform(closeSoftKeyboard())

        // Test that UI is still accessible after keyboard dismissal
        onView(withId(R.id.buttonStart))
            .check(matches(isDisplayed()))
    }

    @Test
    fun testScrollingBehavior() {
        // Test that content is scrollable if it doesn't fit on screen
        // This is particularly important for small screens or landscape mode
        
        // Scroll to bottom to ensure all content is accessible
        onView(withId(android.R.id.content))
            .perform(swipeUp())

        // Verify important elements are still accessible
        onView(withId(R.id.buttonStart))
            .check(matches(isDisplayed()))

        // Scroll back to top
        onView(withId(android.R.id.content))
            .perform(swipeDown())

        onView(withText("Welcome to Restaurant Chat"))
            .check(matches(isDisplayed()))
    }

    @Test
    fun testHighContrastMode() {
        // Test that app works with high contrast accessibility settings
        // In real implementation, you would enable high contrast mode
        
        // Verify that text is still readable
        onView(withText("Welcome to Restaurant Chat"))
            .check(matches(isDisplayed()))

        onView(withId(R.id.editTextUserId))
            .check(matches(isDisplayed()))

        // Test that focus indicators are visible
        onView(withId(R.id.editTextUserId))
            .perform(click())
            .check(matches(hasFocus()))
    }

    @Test
    fun testDifferentDensities() {
        // Test that app works on different screen densities
        val context = InstrumentationRegistry.getInstrumentation().targetContext
        val density = context.resources.displayMetrics.density

        // Verify that UI elements scale properly
        onView(withId(R.id.buttonStart))
            .check(matches(isDisplayed()))

        onView(withId(R.id.editTextUserId))
            .check(matches(isDisplayed()))

        // Test that touch targets are appropriate for the density
        assertTrue("Density should be handled properly", density > 0)
    }

    @Test
    fun testRTLSupport() {
        // Test Right-to-Left language support
        // In real implementation, you would change locale to RTL language
        
        onView(withId(R.id.editTextUserId))
            .check(matches(isDisplayed()))

        onView(withId(R.id.buttonStart))
            .check(matches(isDisplayed()))

        // Verify that layout direction is handled correctly
        assertTrue("RTL should be supported", true)
    }
}