package uz.kometa.sample

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import uz.kometa.ui.*

// Kotlin tabs for meter, stars, steps, tally, countdown, keys, wait, skeleton, quiet and link (see Docs.kt).

@Composable
internal fun MeterMeter() {
    // #region meter/meter
    KometaMeter(14, 25, label = "14 of 25")
    // #endregion
}

@Composable
internal fun MeterInContext() {
    // #region meter/in-context
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            BasicText("Start plan", style = Kometa.type.title.copy(color = Kometa.colors.text))
            KometaTag("Renews in 4 days", tone = KometaTagTone.Warn)
        }
        KometaMeter(3, 5, label = "masters on the team")
        KometaMeter(22, 25, label = "free leads used this month")
        KometaMeter(410, 500, label = "SMS reminders sent")
        KometaButton("Upgrade to Pro", {}, small = true)
    }
    // #endregion
}

@Composable
internal fun MeterTicks() {
    // #region meter/meter-ticks
    KometaMeter(14, 25, label = "14 of 25", showFigure = false)
    // #endregion
}

@Composable
internal fun StarsBasic() {
    // #region stars/basic
    KometaStars(4f, "4 out of 5")
    // #endregion
}

private data class Review(val name: String, val `when`: String, val score: Int, val text: String)

@Composable
internal fun StarsInContext() {
    // #region stars/in-context
    val reviews = listOf(
        Review("Dilnoza Karimova", "2 days ago", 5, "Aziz listened and did exactly what I asked. Booking took a minute."),
        Review("Sardor Tursunov", "last week", 4, "Great fade. I waited ten minutes past my time."),
        Review("Nodira Saidova", "in October", 5, "Clean, calm, and the green tea was good."),
    )
    val average = reviews.sumOf { it.score } / reviews.size.toFloat()
    val avg = ((average * 10).toInt() / 10f).toString()
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            BasicText(avg, style = Kometa.type.title.copy(color = Kometa.colors.text))
            KometaStars(average, "$avg out of 5", size = 20.dp)
            BasicText("${reviews.size} reviews", style = Kometa.type.small.copy(color = Kometa.colors.muted))
        }
        reviews.forEach { r ->
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                    KometaPerson(r.name, meta = r.`when`, size = KometaPersonSize.Sm)
                    KometaStars(r.score.toFloat(), "${r.score} out of 5")
                }
                BasicText(r.text, style = Kometa.type.body.copy(color = Kometa.colors.text))
            }
        }
    }
    // #endregion
}

@Composable
internal fun StarsOptions() {
    // #region stars/stars-options
    KometaStars(7f, "7 out of 10", max = 10, size = 24.dp)
    // #endregion
}

@Composable
internal fun StepsBasic() {
    // #region steps/basic
    KometaSteps(listOf("Service", "Time", "Details", "Done"), current = 2)
    // #endregion
}

@Composable
internal fun StepsInContext() {
    // #region steps/in-context
    var step by remember { mutableIntStateOf(1) }
    var service by remember { mutableStateOf("cut") }
    var time by remember { mutableStateOf("") }
    var name by remember { mutableStateOf("") }
    val slots = listOf(
        KometaSlot("10:00", "10:00"), KometaSlot("11:30", "11:30", disabled = true),
        KometaSlot("14:00", "14:00"), KometaSlot("16:30", "16:30"),
    )
    val ready = when (step) { 1 -> service.isNotEmpty(); 2 -> time.isNotEmpty(); 3 -> name.trim().length > 1; else -> true }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        KometaSteps(listOf("Service", "Time", "Details", "Done"), current = step)
        when (step) {
            1 -> KometaWords(
                listOf(KometaWordOption("cut", "Haircut"), KometaWordOption("beard", "Beard"), KometaWordOption("both", "Both")),
                service, { service = it }, description = "Service",
            )
            2 -> KometaSlots(slots, time, { time = it }, description = "Time")
            3 -> KometaField(name, { name = it }, "Your name")
            else -> KometaBanner("See you at $time, $name. Aziz is expecting you.", tone = KometaBannerTone.Ok, icon = { BasicText("✓") })
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            if (step in 2..3) KometaButton("Back", { step-- }, severity = KometaSeverity.Secondary, variant = KometaButtonVariant.Outlined)
            if (step < 4) KometaButton(if (step == 3) "Book" else "Next", { step++ }, enabled = ready)
            else KometaButton("Book another", { step = 1; time = "" }, severity = KometaSeverity.Secondary)
        }
    }
    // #endregion
}

@Composable
internal fun TallyBasic() {
    // #region tally/basic
    var visits by remember { mutableIntStateOf(184) }
    Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
        KometaTally(visits, max = 240, unit = "of 240 visits")
        KometaWord("Add visits", { visits = minOf(240, visits + 1 + (0..11).random()) })
    }
    // #endregion
}

@Composable
internal fun TallyInContext() {
    // #region tally/in-context
    var visits by remember { mutableIntStateOf(184) }
    var takings by remember { mutableIntStateOf(12480) }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        BasicText("November", style = Kometa.type.small.copy(color = Kometa.colors.muted))
        KometaTally(takings, unit = "k so'm")
        KometaTally(visits, max = 240, unit = "visits of 240")
        KometaWord("A busy day", {
            visits = minOf(240, visits + 1 + (0..11).random())
            takings += 60 + (0..399).random()
        }, quiet = true)
    }
    // #endregion
}

@Composable
internal fun TallyPlain() {
    // #region tally/tally-plain
    KometaTally(12480, unit = "k so'm", durationMillis = 1600)
    // #endregion
}

@Composable
internal fun CountdownBasic() {
    // #region countdown/basic
    var done by remember { mutableStateOf(false) }
    KometaCountdown(duration = 60, label = "to confirm", description = "Time to confirm", onDone = { done = true })
    if (done) BasicText("Countdown done", style = Kometa.type.small.copy(color = Kometa.colors.muted))
    // #endregion
}

@Composable
internal fun CountdownInContext() {
    // #region countdown/in-context
    var code by remember { mutableStateOf("") }
    var canResend by remember { mutableStateOf(false) }
    var resends by remember { mutableIntStateOf(0) }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        BasicText("Code sent to +998 90 ··· 45 67", style = Kometa.type.small.copy(color = Kometa.colors.muted))
        KometaCode(code, { code = it }, label = "SMS code")
        if (canResend) KometaWord("Send the code again", { canResend = false; resends++ })
        // A new key restarts the ticks after each resend.
        else KometaCountdown(duration = 20, label = "to send it again", key = resends, onDone = { canResend = true })
    }
    // #endregion
}

@Composable
internal fun CountdownShort() {
    // #region countdown/countdown-short
    KometaCountdown(duration = 15, label = "to resend the code")
    // #endregion
}

@Composable
internal fun KeysBasic() {
    // #region keys/basic
    KometaKeys("Ctrl+Shift+P", play = true)
    // #endregion
}

@Composable
internal fun KeysInContext() {
    // #region keys/in-context
    val shortcuts = listOf("New visit" to "N", "Find a client" to "Ctrl+K", "Next day" to "Alt+→", "Close a sheet" to "Esc")
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        BasicText("Shortcuts", style = Kometa.type.small.copy(color = Kometa.colors.muted))
        shortcuts.forEach { (what, keys) ->
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
                BasicText(what, style = Kometa.type.body.copy(color = Kometa.colors.text))
                KometaKeys(keys)
            }
        }
    }
    // #endregion
}

@Composable
internal fun KeysPlay() {
    // #region keys/keys-play
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        KometaKeys("Ctrl+K", play = true)
        KometaKeys("⌘+Enter")
    }
    // #endregion
}

@Composable
internal fun WaitWait() {
    // #region wait/wait
    KometaWait("Loading visits")
    // #endregion
}

@Composable
internal fun WaitInContext() {
    // #region wait/in-context
    var syncing by remember { mutableStateOf(false) }
    var syncs by remember { mutableIntStateOf(0) }
    LaunchedEffect(syncing) {
        if (syncing) { delay(1500); syncing = false; syncs++ }
    }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        KometaHeading("Telegram bot") { KometaWord("Sync now", { syncing = true }, busy = syncing) }
        if (syncing) KometaWait("Pulling new bookings from Telegram")
        else Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            KometaTag("Connected", tone = KometaTagTone.Done)
            BasicText(if (syncs == 0) "Last sync at 09:41 · 3 new bookings" else "Synced just now · 3 new bookings", style = Kometa.type.small.copy(color = Kometa.colors.muted))
        }
    }
    // #endregion
}

@Composable
internal fun SkeletonBasic() {
    // #region skeleton/basic
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        KometaSkeleton(rows = 3, label = "Loading list")
        KometaSkeleton(shape = KometaSkeletonShape.Card, label = "Loading card")
        KometaSkeleton(Modifier.fillMaxWidth(0.6f), shape = KometaSkeletonShape.Line)
    }
    // #endregion
}

@Composable
internal fun SkeletonInContext() {
    // #region skeleton/in-context
    var loading by remember { mutableStateOf(false) }
    LaunchedEffect(loading) {
        if (loading) { delay(1400); loading = false }
    }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        if (loading) {
            KometaSkeleton(rows = 1, lines = 2, label = "Loading master")
            KometaSkeleton(rows = 3, avatar = false, lines = 1, label = "Loading prices")
        } else {
            KometaPerson("Dilnoza Karimova", meta = "Stylist · Chilonzor", size = KometaPersonSize.Lg)
            KometaRows {
                KometaRow(label = "Women's haircut") { KometaRowValue("120 000 so'm") }
                KometaRow(label = "Colour") { KometaRowValue("from 250 000 so'm") }
                KometaRow(label = "Styling") { KometaRowValue("70 000 so'm") }
            }
        }
        KometaButton("Reload", { loading = true }, severity = KometaSeverity.Secondary, small = true, enabled = !loading)
    }
    // #endregion
}

@Composable
internal fun SkeletonOptions() {
    // #region skeleton/skeleton-options
    KometaSkeleton(rows = 2, avatar = false, lines = 3, label = "Loading text rows")
    // #endregion
}

@Composable
internal fun QuietBasic() {
    // #region quiet/basic
    KometaQuiet("No visits yet", hint = "Book the first one and it shows up here.")
    // #endregion
}

@Composable
internal fun QuietInContext() {
    // #region quiet/in-context
    var tab by remember { mutableStateOf("cancelled") }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        KometaWords(
            listOf(KometaWordOption("upcoming", "Upcoming", count = "2"), KometaWordOption("cancelled", "Cancelled", count = "0")),
            tab, { tab = it }, tabs = true, description = "Visits",
        )
        if (tab == "upcoming") {
            KometaPerson("Dilnoza Karimova", meta = "Tomorrow 10:00 · Haircut")
            KometaPerson("Aziz Rahimov", meta = "Friday 11:30 · Beard trim")
        } else {
            KometaQuiet("No cancelled visits", hint = "Every client this month came as booked.") {
                KometaWord("See upcoming", { tab = "upcoming" })
            }
        }
    }
    // #endregion
}

@Composable
internal fun LinkCopy() {
    // #region link/copy
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
        BasicText("kometa.uz/b/dilnoza", style = Kometa.type.body.copy(color = Kometa.colors.text))
        KometaLink("https://kometa.uz/b/dilnoza", "Copy", "Copied", description = "Copy booking link")
    }
    // #endregion
}

@Composable
internal fun LinkInContext() {
    // #region link/in-context
    var open by remember { mutableStateOf(true) }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        KometaPerson("Aziz Rahimov", meta = "Your booking page")
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            BasicText("kometa.uz/b/aziz", style = Kometa.type.body.copy(color = if (open) Kometa.colors.text else Kometa.colors.muted))
            KometaLink("https://kometa.uz/b/aziz", "Copy", "Copied", description = "Copy booking link", enabled = open)
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            BasicText("Online booking", style = Kometa.type.body.copy(color = Kometa.colors.text))
            KometaToggle(open, { open = it }, onLabel = "On", offLabel = "Off", label = "Online booking")
        }
        KometaTag(if (open) "Clients can book" else "Link paused", tone = if (open) KometaTagTone.Done else KometaTagTone.Wait)
    }
    // #endregion
}

@Composable
internal fun LinkOptions() {
    // #region link/copy-options
    Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
        KometaLink("https://kometa.uz/b/dilnoza", "Copy", "Copied", description = "Copy for three seconds", copiedMs = 3000)
        KometaLink("https://kometa.uz/b/dilnoza", "Copy", "Copied", description = "Copy disabled", enabled = false)
    }
    // #endregion
}

/** This file's regions by key, merged into [DOC_EXAMPLES]. */
internal val MISC_EXAMPLES = mapOf(
    "meter/meter" to DocExample { MeterMeter() },
    "meter/in-context" to DocExample { MeterInContext() },
    "meter/meter-ticks" to DocExample { MeterTicks() },
    "stars/basic" to DocExample { StarsBasic() },
    "stars/in-context" to DocExample { StarsInContext() },
    "stars/stars-options" to DocExample { StarsOptions() },
    "steps/basic" to DocExample { StepsBasic() },
    "steps/in-context" to DocExample { StepsInContext() },
    "tally/basic" to DocExample { TallyBasic() },
    "tally/in-context" to DocExample { TallyInContext() },
    "tally/tally-plain" to DocExample { TallyPlain() },
    "countdown/basic" to DocExample { CountdownBasic() },
    "countdown/in-context" to DocExample { CountdownInContext() },
    "countdown/countdown-short" to DocExample { CountdownShort() },
    "keys/basic" to DocExample { KeysBasic() },
    "keys/in-context" to DocExample { KeysInContext() },
    "keys/keys-play" to DocExample { KeysPlay() },
    "wait/wait" to DocExample { WaitWait() },
    "wait/in-context" to DocExample { WaitInContext() },
    "skeleton/basic" to DocExample { SkeletonBasic() },
    "skeleton/in-context" to DocExample { SkeletonInContext() },
    "skeleton/skeleton-options" to DocExample { SkeletonOptions() },
    "quiet/basic" to DocExample { QuietBasic() },
    "quiet/in-context" to DocExample { QuietInContext() },
    "link/copy" to DocExample { LinkCopy() },
    "link/in-context" to DocExample { LinkInContext() },
    "link/copy-options" to DocExample { LinkOptions() },
)
