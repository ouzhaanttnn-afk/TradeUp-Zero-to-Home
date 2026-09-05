package com.tradeup.zerotohome;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import android.content.Context;
import android.webkit.WebView;
import androidx.test.ext.junit.rules.ActivityScenarioRule;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class TradeUpWebViewSmokeTest {

    @Rule
    public ActivityScenarioRule<MainActivity> activityRule =
        new ActivityScenarioRule<>(MainActivity.class);

    @Test
    public void usesTheLockedApplicationId() {
        Context appContext = InstrumentationRegistry.getInstrumentation().getTargetContext();
        assertEquals("com.tradeup.zerotohome", appContext.getPackageName());
    }

    @Test
    public void loadsTheTradeUpShellFromBundledAssets() throws Exception {
        AtomicReference<WebView> webViewReference = new AtomicReference<>();
        activityRule.getScenario().onActivity(activity ->
            webViewReference.set(activity.findViewById(R.id.webview))
        );

        WebView webView = webViewReference.get();
        assertNotNull("Capacitor WebView must be present", webView);

        String bodyText = waitForBodyText(webView, 15);
        String currentUrl = waitForUrl(webView, 15);

        assertTrue("The app must load from Capacitor's bundled origin", currentUrl.startsWith("https://localhost"));
        assertTrue("The TradeUp brand must render", bodyText.contains("TRADEUP"));
        assertTrue("The four-tab shell must render Pazar", bodyText.contains("Pazar"));
        assertTrue("The four-tab shell must render Takip", bodyText.contains("Takip"));
        assertTrue("The four-tab shell must render Portföy", bodyText.contains("Portföy"));
        assertTrue("The four-tab shell must render Yolculuk", bodyText.contains("Yolculuk"));
    }

    private String waitForBodyText(WebView webView, int timeoutSeconds) throws Exception {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(timeoutSeconds);
        String bodyText = "";
        while (System.nanoTime() < deadline) {
            CountDownLatch callback = new CountDownLatch(1);
            AtomicReference<String> result = new AtomicReference<>("");
            activityRule.getScenario().onActivity(activity ->
                webView.evaluateJavascript("document.body ? document.body.innerText : ''", value -> {
                    result.set(value == null ? "" : value);
                    callback.countDown();
                })
            );
            callback.await(1, TimeUnit.SECONDS);
            bodyText = result.get();
            if (bodyText.contains("TRADEUP") && bodyText.contains("Yolculuk")) return bodyText;
            Thread.sleep(200);
        }
        return bodyText;
    }

    private String waitForUrl(WebView webView, int timeoutSeconds) throws Exception {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(timeoutSeconds);
        AtomicReference<String> url = new AtomicReference<>("");
        while (System.nanoTime() < deadline) {
            activityRule.getScenario().onActivity(activity -> {
                String current = webView.getUrl();
                url.set(current == null ? "" : current);
            });
            if (url.get().startsWith("https://localhost")) return url.get();
            Thread.sleep(200);
        }
        return url.get();
    }
}
