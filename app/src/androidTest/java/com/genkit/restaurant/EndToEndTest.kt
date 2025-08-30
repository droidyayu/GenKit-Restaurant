package com.genkit.restaurant

import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.*
import androidx.test.espresso.assertion.ViewAssertions.*
import androidx.test.espresso.intent.Intents
import androidx.test.espresso.matcher.ViewMatchers.*
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.genkit.restaurant.ui.UserIdActivity
import org.junit.After
import org.junit.Before
import org.junit.Rule
import org.junit.Test
import org.junit.runner.RunWith

/**
 * End-to-end test for complete user flow from user ID input to chat functionality
 */
@RunWith(AndroidJUnit4::class)
class EndToEndTest {

    @get:Rule
    val activityRule = ActivityScenarioRule(UserIdActivity::class.java)

    @Before
    fun setup() {
        Intents.init()
    }

    @After
    fun tearDown() {
        Intents.release()
    }

    @Test
    fun testCompleteUserFlow() {
        // Step 1: User enters ID
        onView(withId(R.id.editTextUserId))
            .perform(click())
            .perform(typeText("testuser123"))
            .perform(closeSoftKeyboard())

        // Step 2: User starts chat
        onView(withId(R.id.buttonStart))
            .perform(click())

        // Step 3: Wait for loading and verify navigation to chat
        Thread.sleep(2000) // Wait for potential network call

        // Note: In real implementation, you would mock the network calls
        // and verify that ChatActivity is launched
        
        // For now, verify that the loading state is handled
        onView(withId(R.id.progressBar))
            .check(matches(isDisplayed()))
    }

    @Test
    fun testErrorHandlingFlow() {
        // Test error scenario
        onView(withId(R.id.editTextUserId))
            .perform(click())
            .perform(typeText("invalid@user"))
            .perform(closeSoftKeyboard())

        onView(withId(R.id.buttonStart))
            .perform(click())

        // Verify error message is shown
        onView(withId(R.id.textViewError))
            .check(matches(isDisplayed()))

        // Test retry functionality
        onView(withId(R.id.buttonRetry))
            .check(matches(isDisplayed()))
            .perform(click())
    }

    @Test
    fun testInputValidation() {
        // Test empty input
        onView(withId(R.id.buttonStart))
            .perform(click())

        onView(withId(R.id.textViewError))
            .check(matches(isDisplayed()))

        // Test valid input
        onView(withId(R.id.editTextUserId))
            .perform(click())
            .perform(typeText("validuser"))
            .perform(closeSoftKeyboard())

        onView(withId(R.id.buttonStart))
            .perform(click())

        // Error should be hidden
        onView(withId(R.id.textViewError))
            .check(matches(withEffectiveVisibility(Visibility.GONE)))
    }

    @Test
    fun testOrientationChange() {
        // Enter some text
        onView(withId(R.id.editTextUserId))
            .perform(click())
            .perform(typeText("testuser"))
            .perform(closeSoftKeyboard())

        // Rotate device
        activityRule.scenario.onActivity { activity ->
            activity.requestedOrientation = android.content.pm.ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
        }

        Thread.sleep(1000) // Wait for rotation

        // Verify text is preserved
        onView(withId(R.id.editTextUserId))
            .check(matches(withText("testuser")))

        // Verify UI is still functional
        onView(withId(R.id.buttonStart))
            .check(matches(isDisplayed()))
            .perform(click())
    }

    @Test
    fun testAccessibilityFlow() {
        // Test that accessibility features work in the complete flow
        onView(withId(R.id.editTextUserId))
            .check(matches(hasContentDescription()))
            .perform(click())
            .perform(typeText("accessibleuser"))

        onView(withId(R.id.buttonStart))
            .check(matches(hasContentDescription()))
            .perform(click())

        // Verify accessibility is maintained throughout the flow
        onView(withId(R.id.progressBar))
            .check(matches(isDisplayed()))
    }
}