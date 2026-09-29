package com.tradeup.zerotohome;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertNotNull;
import static org.junit.Assert.assertTrue;

import android.content.Context;
import android.graphics.Bitmap;
import android.view.KeyEvent;
import android.view.inputmethod.InputMethodManager;
import android.webkit.WebView;
import androidx.lifecycle.Lifecycle;
import androidx.test.ext.junit.rules.ActivityScenarioRule;
import androidx.test.ext.junit.runners.AndroidJUnit4;
import androidx.test.platform.app.InstrumentationRegistry;
import java.io.File;
import java.io.FileOutputStream;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.TimeUnit;
import java.util.concurrent.atomic.AtomicReference;
import org.json.JSONObject;
import org.junit.Rule;
import org.junit.Test;
import org.junit.runner.RunWith;

@RunWith(AndroidJUnit4.class)
public class TradeUpWebViewSmokeTest {
    @Rule
    public ActivityScenarioRule<MainActivity> activityRule = new ActivityScenarioRule<>(MainActivity.class);

    @Test
    public void usesTheLockedApplicationId() {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        assertEquals("com.tradeup.zerotohome", context.getPackageName());
    }

    @Test
    public void firstSaleNavigationBackAndResumePreserveTheSave() throws Exception {
        // Actions use production UI, not injected game or entitlement fixtures.
        waitFor("document.querySelector('.profile-onboarding') !== null");
        assertEquals("true", js("location.origin === 'https://localhost'"));
        assertEquals("3", js("document.querySelectorAll('.avatar-picker--onboarding button').length"));
        assertEquals("true", js("document.querySelector('.onboarding-start').disabled"));
        checkWidth();
        js("""
            (() => {
              const input = document.querySelector('.onboarding-name input');
              Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, 'TradeUp Test');
              input.dispatchEvent(new Event('input', { bubbles: true }));
              document.querySelectorAll('.avatar-picker--onboarding button')[1].click();
            })()
            """);
        hideKeyboard();
        waitFor("!document.querySelector('.onboarding-start').disabled");
        js("document.querySelector('.onboarding-start').click()");
        waitFor("document.querySelector('.starting-sale button') !== null");
        js("document.querySelector('.starting-sale button').click()");
        waitFor("document.querySelector('.market-grid .market-card') !== null");
        JSONObject saved = waitForSave();
        assertEquals(42000, saved.getLong("cashMinor"));
        assertEquals("COMPLETE", saved.getJSONObject("ftue").getString("stage"));
        assertEquals("TradeUp Test", saved.getJSONObject("profile").getString("displayName"));
        assertEquals("1", js("window.__nativeSave.transactionJournal.filter(e => e.kind === 'SALE').length"));
        screenshot("01-market.png");

        String[] tabs = {"market", "radar", "portfolio", "journey"};
        for (int index = 0; index < tabs.length; index++) {
            js("document.querySelectorAll('.app-shell > nav > button')[" + index + "].click()");
            waitFor("document.querySelector('.app-shell.tab-" + tabs[index] + "') !== null");
            assertEquals("1", js("document.querySelectorAll('.app-shell > nav > button[aria-current=page]').length"));
            checkWidth();
        }
        pressBack();
        waitFor("document.querySelector('.app-shell.tab-market') !== null");
        js("document.querySelector('.market-grid .market-card').click()");
        waitFor("document.querySelector('[role=dialog][aria-modal=true]') !== null");
        checkWidth();
        screenshot("02-product.png");
        pressBack();
        waitFor("document.querySelector('[role=dialog][aria-modal=true]') === null");

        js("document.querySelector('.profile-settings-button').click()");
        waitFor("document.querySelector('.settings-card .profile-identity input') !== null");
        assertEquals("\"TradeUp Test\"", js("document.querySelector('.settings-card .profile-identity input').value"));
        hideKeyboard();
        checkWidth();
        screenshot("03-settings.png");
        pressBack();
        waitFor("document.querySelector('[role=dialog][aria-modal=true]') === null");

        activityRule.getScenario().moveToState(Lifecycle.State.CREATED);
        activityRule.getScenario().moveToState(Lifecycle.State.RESUMED);
        waitFor("document.querySelector('.app-shell') !== null");
        assertSaveEqual(saved, waitForSave());
        // New WebView hydrates IndexedDB again, not only a React repaint.
        activityRule.getScenario().recreate();
        waitFor("document.querySelector('.app-shell') !== null");
        assertEquals("true", js("document.querySelector('.profile-onboarding') === null"));
        assertSaveEqual(saved, waitForSave());
        checkWidth();
    }

    private void assertSaveEqual(JSONObject before, JSONObject after) throws Exception {
        for (String key : new String[]{"cashMinor", "realizedProfitMinor", "transactionJournal", "ownedAssets", "profile"}) {
            assertEquals("Persisted " + key, before.get(key).toString(), after.get(key).toString());
        }
    }

    private JSONObject waitForSave() throws Exception {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(25);
        do {
            js("""
            (() => {
              window.__nativeSave = null;
              window.__nativeSaveRead = false;
              window.__nativeSaveError = false;
              const fail = () => { window.__nativeSaveError = true; window.__nativeSaveRead = true; };
              const request = indexedDB.open('tradeup', 1);
              request.onerror = fail;
              request.onsuccess = () => {
                const db = request.result;
                const read = db.transaction('game').objectStore('game').get('main');
                read.onerror = () => { fail(); db.close(); };
                read.onsuccess = () => { window.__nativeSave = read.result; window.__nativeSaveRead = true; db.close(); };
              };
            })()
            """);
            waitFor("window.__nativeSaveRead === true");
            assertEquals("IndexedDB read must succeed", "false", js("window.__nativeSaveError"));
            if ("true".equals(js("window.__nativeSave?.ftue?.stage === 'COMPLETE'"))) break;
            Thread.sleep(150);
        } while (System.nanoTime() < deadline);
        assertEquals("Sale must persist", "true", js("window.__nativeSave?.ftue?.stage === 'COMPLETE'"));
        assertEquals("Journal reconciles after settlement and hydration", "true", js("""
            (() => {
              const s = window.__nativeSave;
              const sum = key => s.transactionJournal.reduce((n, e) => n + e[key], 0);
              return sum('cashDeltaMinor') === s.cashMinor &&
                sum('realizedProfitDeltaMinor') === s.realizedProfitMinor &&
                sum('costBasisDeltaMinor') === s.ownedAssets.filter(a => a.state !== 'SOLD_COMPLETE').reduce((n, a) => n + a.bookCostMinor, 0);
            })()
            """));
        return new JSONObject(js("window.__nativeSave"));
    }

    private void checkWidth() throws Exception {
        assertEquals("No horizontal document overflow", "true", js("document.documentElement.scrollWidth <= innerWidth + 1"));
        assertEquals("Visible main controls must fit", "true", js("""
            [...document.querySelectorAll('.app-shell > nav > button, .onboarding-start, .sheet .close')]
              .filter(el => el.getClientRects().length)
              .every(el => { const r = el.getBoundingClientRect(); return r.left >= -1 && r.right <= innerWidth + 1; })
            """));
    }

    private void hideKeyboard() {
        activityRule.getScenario().onActivity(activity -> {
            InputMethodManager keyboard = (InputMethodManager) activity.getSystemService(Context.INPUT_METHOD_SERVICE);
            keyboard.hideSoftInputFromWindow(activity.getWindow().getDecorView().getWindowToken(), 0);
        });
    }

    private void pressBack() {
        InstrumentationRegistry.getInstrumentation().sendKeyDownUpSync(KeyEvent.KEYCODE_BACK);
    }

    private void screenshot(String name) throws Exception {
        Context context = InstrumentationRegistry.getInstrumentation().getTargetContext();
        File directory = new File(context.getExternalFilesDir(null), "native-smoke");
        assertTrue(directory.isDirectory() || directory.mkdirs());
        Bitmap bitmap = InstrumentationRegistry.getInstrumentation().getUiAutomation().takeScreenshot();
        assertNotNull(bitmap);
        try (FileOutputStream output = new FileOutputStream(new File(directory, name))) {
            assertTrue(bitmap.compress(Bitmap.CompressFormat.PNG, 100, output));
        }
        bitmap.recycle();
    }

    private void waitFor(String expression) throws Exception {
        long deadline = System.nanoTime() + TimeUnit.SECONDS.toNanos(25);
        while (System.nanoTime() < deadline) {
            if ("true".equals(js(expression))) return;
            Thread.sleep(150);
        }
        throw new AssertionError("Timed out waiting for " + expression + "; body=" + js("document.body.innerText.slice(0, 600)"));
    }

    private String js(String expression) throws Exception {
        CountDownLatch callback = new CountDownLatch(1);
        AtomicReference<String> result = new AtomicReference<>("null");
        activityRule.getScenario().onActivity(activity -> {
            WebView webView = activity.getBridge().getWebView();
            assertNotNull(webView);
            webView.evaluateJavascript(expression, value -> {
                result.set(value);
                callback.countDown();
            });
        });
        assertTrue("JavaScript callback", callback.await(5, TimeUnit.SECONDS));
        return result.get();
    }
}
