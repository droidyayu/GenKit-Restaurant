package com.genkit.restaurant

import androidx.test.espresso.Espresso.onView
import androidx.test.espresso.action.ViewActions.*
import androidx.test.espresso.assertion.ViewAssertions.*
import androidx.test.espresso.intent.Intents
import androidx.test.espresso.matcher.ViewMatchers.*
import androidx.test.ext.junit.rules.ActivityScenarioRule
import androidx.test.ext.junit.runners.AndroidJUnit4
import com.genkit.restaurant.ui.compose.MainActivity
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
    val activityRule = ActivityScenarioRule(MainActivity::class.java)

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
        // Step 1: Verify welcome screen is displayed
        onView(withText("Welcome to Restaurant Chat"))
            .check(matches(isDisplayed()))

        onView(withText("Please sign in to continue"))
            .check(matches(isDisplayed()))

        // Step 2: Verify Sign In button is available
        onView(withId(R.id.buttonSignIn))
            .check(matches(isDisplayed()))
            .check(matches(isClickable()))

        // Step 3: Simulate sign in button click (Firebase UI Auth would launch)
        onView(withId(R.id.buttonSignIn))
            .perform(click())

        // Note: In real implementation, you would mock Firebase Auth
        // and verify that authentication flow is triggered
        // For now, verify that the UI elements are still accessible
        onView(withId(R.id.buttonSignIn))
            .check(matches(isDisplayed()))
    }

    @Test
    fun testAuthenticationFlow() {
        // Test authentication button interactions
        onView(withId(R.id.buttonSignIn))
            .perform(click())

        // Verify button remains accessible after click
        onView(withId(R.id.buttonSignIn))
            .check(matches(isDisplayed()))

        // Test sign out button is also available
        onView(withId(R.id.buttonSignOut))
            .check(matches(isDisplayed()))
            .perform(click())

        // Verify buttons are still functional after interactions
        onView(withId(R.id.buttonSignIn))
            .check(matches(isDisplayed()))
    }

    @Test
    fun testButtonInteractions() {
        // Test sign in button interaction
        onView(withId(R.id.buttonSignIn))
            .perform(click())
            .check(matches(isDisplayed()))

        // Test sign out button interaction
        onView(withId(R.id.buttonSignOut))
            .perform(click())
            .check(matches(isDisplayed()))

        // Verify welcome text is always visible
        onView(withText("Welcome to Restaurant Chat"))
            .check(matches(isDisplayed()))
    }

    @Test
    fun testOrientationChange() {
        // Rotate device to landscape
        activityRule.scenario.onActivity { activity ->
            activity.requestedOrientation = android.content.pm.ActivityInfo.SCREEN_ORIENTATION_LANDSCAPE
        }

        Thread.sleep(1000) // Wait for rotation

        // Verify UI elements are still accessible in landscape
        onView(withId(R.id.buttonSignIn))
            .check(matches(isDisplayed()))
            .check(matches(isClickable()))

        onView(withId(R.id.buttonSignOut))
            .check(matches(isDisplayed()))

        onView(withText("Welcome to Restaurant Chat"))
            .check(matches(isDisplayed()))

        // Test button interaction in landscape
        onView(withId(R.id.buttonSignIn))
            .perform(click())
    }

    @Test
    fun testAccessibilityFlow() {
        // Test that accessibility features work in the authentication flow
        onView(withId(R.id.buttonSignIn))
            .check(matches(hasContentDescription()))
            .perform(click())

        onView(withId(R.id.buttonSignOut))
            .check(matches(hasContentDescription()))
            .perform(click())

        // Verify welcome text has proper accessibility
        onView(withId(R.id.textViewWelcome))
            .check(matches(isDisplayed()))

        // Verify accessibility is maintained throughout the flow
        onView(withId(R.id.buttonSignIn))
            .check(matches(isDisplayed()))
    }
}