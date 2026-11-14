package uz.kometa.sample

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.SystemBarStyle
import androidx.activity.enableEdgeToEdge
import android.graphics.Color
import androidx.compose.foundation.background
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.systemBarsPadding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.unit.dp
import uz.kometa.ui.*

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val system = isSystemInDarkTheme()
            var dark by rememberSaveable { mutableStateOf(system) }
            // The bar icons follow the app's theme toggle, not the system's.
            LaunchedEffect(dark) {
                val bars = if (dark) SystemBarStyle.dark(Color.TRANSPARENT) else SystemBarStyle.light(Color.TRANSPARENT, Color.TRANSPARENT)
                enableEdgeToEdge(bars, bars)
            }
            KometaTheme(dark = dark) { Showcase(dark) { dark = it } }
        }
    }
}

private val TABS = listOf(KometaTab("controls", "Controls"), KometaTab("inputs", "Inputs"), KometaTab("display", "Display"), KometaTab("overlays", "Overlays"), KometaTab("more", "More"), KometaTab("extra", "Extra"))

@Composable
private fun Showcase(dark: Boolean, onDark: (Boolean) -> Unit) {
    var tab by rememberSaveable { mutableStateOf("controls") }
    Box(Modifier.fillMaxSize().background(Kometa.colors.bg).systemBarsPadding().imePadding()) {
        Column(
            Modifier.fillMaxSize().verticalScroll(rememberScrollState()).padding(16.dp).padding(bottom = 96.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                BasicText("KOMETA UI", Modifier.weight(1f), style = Kometa.type.eyebrow.copy(color = Kometa.colors.muted))
                KometaToggle(dark, onDark, onLabel = "Dark", offLabel = "Light", label = "Dark theme")
            }
            when (tab) {
                "controls" -> Controls()
                "inputs" -> Inputs()
                "display" -> Display()
                "more" -> More()
                "extra" -> Extra()
                else -> Overlays()
            }
        }
        KometaTabbar(
            TABS, tab, { tab = it },
            icon = { Box(Modifier.size(18.dp).background(LocalKometaContentColor.current, CircleShape)) },
            modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 12.dp),
        )
    }
}

@Composable
private fun Label(text: String) = BasicText(text, style = Kometa.type.small.copy(color = Kometa.colors.muted))

@Composable
private fun ColumnScope.Controls() {
    var loading by remember { mutableStateOf(false) }
    var taps by remember { mutableIntStateOf(0) }
    KometaHeading("Buttons")
    KometaButton("Book now ($taps)", { taps++ }, Modifier.fillMaxWidth())
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        KometaButton("Later", { taps++ }, severity = KometaSeverity.Secondary, small = true)
        KometaButton("Cancel", { taps++ }, severity = KometaSeverity.Danger, variant = KometaButtonVariant.Outlined, small = true)
        KometaButton(if (loading) "Saving" else "Save", { loading = !loading }, small = true, loading = loading, severity = KometaSeverity.Secondary)
        KometaButton("Off", {}, small = true, enabled = false)
    }
    KometaButton("Stop loading", { loading = false }, variant = KometaButtonVariant.Text, small = true)

    KometaHeading("Chips and badge")
    val picked = remember { mutableStateListOf("Haircut") }
    var inbox by remember { mutableIntStateOf(3) }
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        listOf("Haircut", "Beard", "Color").forEach { s ->
            KometaChip(s, s in picked, { if (it) picked += s else picked -= s }, count = if (s == "Haircut") "12" else "")
        }
    }
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
        KometaBadge(inbox) { KometaChip("Inbox", false, { inbox++ }) }
        KometaButton("Clear", { inbox = 0 }, variant = KometaButtonVariant.Text, small = true)
        KometaButton("+120", { inbox += 120 }, variant = KometaButtonVariant.Text, small = true)
    }

    KometaHeading("Check, tick, toggle")
    var a by remember { mutableStateOf(true) }
    var b by remember { mutableStateOf(false) }
    var t by remember { mutableStateOf(false) }
    var open by remember { mutableStateOf(true) }
    KometaCheck("Bring the receipt", a, { a = it })
    KometaCheck("Call the shop", b, { b = it })
    Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
        KometaTick(t, { t = it }, "Paid")
        KometaToggle(open, { open = it }, onLabel = "Open", offLabel = "Closed")
        KometaToggle(open, { open = it }, label = "Open")
    }

    KometaHeading("Stepper, slider, rating")
    var hours by remember { mutableIntStateOf(2) }
    var km by remember { mutableIntStateOf(12) }
    var score by remember { mutableIntStateOf(0) }
    KometaStepper(hours, { hours = it }, unit = "hours", max = 8, decrementLabel = "Fewer", incrementLabel = "More")
    KometaSlider(km, { km = it }, max = 20, unit = "km", label = "Distance")
    KometaRating(score, { score = it }, words = listOf("Bad", "Poor", "Fine", "Good", "Great"), label = "Your score")
    KometaPair("Keep it", "Delete", { taps = 0 }, { loading = true }, busy = loading)
}

@Composable
private fun ColumnScope.Inputs() {
    var name by remember { mutableStateOf("") }
    var pass by remember { mutableStateOf("") }
    var q by remember { mutableStateOf("") }
    var price by remember { mutableStateOf<Long?>(12480) }
    var seats by remember { mutableStateOf<Long?>(null) }
    var phone by remember { mutableStateOf("") }
    var role by remember { mutableStateOf<String?>("Barber") }
    var day by remember { mutableStateOf<String?>(null) }
    KometaSearch(q, { q = it }, label = "Search", placeholder = "Find a barber", clearLabel = "Clear")
    KometaField(name, { name = it }, label = "Your name", showCount = true, maxLength = 20)
    KometaField(pass, { pass = it }, label = "Password", small = true, password = true, error = if (pass.isNotEmpty() && pass.length < 6) "At least 6 characters" else "")
    Label("price = $price")
    KometaNumber(price, { price = it }, label = "Price", money = true, suffix = "so'm", max = 10_000_000)
    Label("seats = $seats (1..12)")
    KometaNumber(seats, { seats = it }, label = "Seats", min = 1, max = 12, placeholder = "0")
    Label("phone = \"$phone\"")
    KometaDigits(phone, { phone = it }, label = "Phone")
    KometaDigits(phone, { phone = it }, label = "Phone", small = true)
    Label("role = $role, day = $day")
    KometaSelect(listOf("Owner", "Barber", "Admin"), role, { role = it }, prefix = "Role:", description = "Role")
    KometaSelect(listOf("Today", "Tomorrow", "This week", "Next week"), day, { day = it }, placeholder = "Any day", pill = true, description = "Day")
    var slot by remember { mutableStateOf<String?>(null) }
    KometaSelect((1..30).map { "Slot $it" }, slot, { slot = it }, placeholder = "A long list")
}

@Composable
private fun ColumnScope.Display() {
    var banner by remember { mutableStateOf(true) }
    var step by remember { mutableIntStateOf(1) }
    var fold by remember { mutableStateOf(false) }
    var faq by remember { mutableStateOf<Int?>(0) }
    var visits by remember { mutableIntStateOf(1240) }
    var restart by remember { mutableIntStateOf(0) }
    var done by remember { mutableStateOf(false) }
    KometaCrumbs(listOf("Shops", "Barber Shop", "Services"), onPick = { step = it })
    if (banner) KometaBanner("No internet connection.", tone = KometaBannerTone.Warn, actionLabel = "Retry", closeLabel = "Close", onDismiss = { banner = false })
    else KometaButton("Show banner", { banner = true }, variant = KometaButtonVariant.Text, small = true)
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        KometaTag("Now", tone = KometaTagTone.Now)
        KometaTag("Waiting", tone = KometaTagTone.Wait)
        KometaTag("Done", tone = KometaTagTone.Done)
        KometaTag("Error", tone = KometaTagTone.Error)
    }
    KometaPerson("Ali Valiyev", meta = "Haircut · 14:30") { KometaTag("Now", tone = KometaTagTone.Now) }
    KometaAvatars(listOf("Ali Valiyev", "Sardor", "Madina K", "Bek", "Olim", "Zarina").map { KometaAvatar(it) })
    KometaStars(4.5f, "4.5 of 5", size = 20.dp)
    KometaMeter(17, 25, unit = "visits left")
    KometaTally(visits, max = 2000, unit = "visits")
    KometaButton("+300 visits", { visits = (visits + 300) % 2400 }, variant = KometaButtonVariant.Text, small = true)
    KometaCountdown(duration = 20, label = if (done) "done" else "to confirm", key = restart, onDone = { done = true })
    KometaButton("Restart countdown", { restart++; done = false }, variant = KometaButtonVariant.Text, small = true)
    KometaSteps(listOf("Service", "Time", "Confirm"), current = step)
    KometaButton("Next step", { step = (step + 1) % 3 }, variant = KometaButtonVariant.Text, small = true)
    KometaFold("Opening hours", fold, { fold = it }) { Label("Mon–Sat 9:00–20:00") }
    listOf("Can I cancel a booking?", "Do you take cards?", "Is there parking?").forEachIndexed { i, q ->
        KometaAccordionItem(q, faq == i, { faq = if (it) i else null }) { Label("Answer to: $q") }
    }
    KometaWait("Loading slots")
    KometaSkeleton(rows = 2)
}

@Composable
private fun ColumnScope.Overlays() {
    var drawer by remember { mutableStateOf<KometaDrawerPosition?>(null) }
    val toasts = remember { mutableStateListOf<KometaToastItem>() }
    var next by remember { mutableIntStateOf(1) }
    var name by remember { mutableStateOf("") }
    KometaButton("Bottom sheet", { drawer = KometaDrawerPosition.Bottom }, Modifier.fillMaxWidth())
    KometaButton("Side panel", { drawer = KometaDrawerPosition.Right }, Modifier.fillMaxWidth(), severity = KometaSeverity.Secondary)
    KometaButton("Toast", {
        val kind = KometaToastKind.entries[next % 4]
        toasts += KometaToastItem(next.toLong(), "Toast $next ($kind)", kind)
        next++
    }, Modifier.fillMaxWidth(), severity = KometaSeverity.Secondary)
    Box(Modifier.fillMaxWidth().padding(top = 200.dp)) {
        KometaToasts(toasts, onDismiss = { id -> toasts.removeAll { it.id == id } }, modifier = Modifier.align(Alignment.Center))
    }
    drawer?.let { pos ->
        KometaDrawer(visible = true, onDismiss = { drawer = null }, position = pos, label = "Book") {
            Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                BasicText("Book a time", style = Kometa.type.title.copy(color = Kometa.colors.text))
                KometaField(name, { name = it }, label = "Your name")
                KometaPair("Cancel", "Confirm", { drawer = null }, { drawer = null }, primary = true)
            }
        }
    }
}

@Composable
private fun ColumnScope.More() {
    var word by remember { mutableStateOf("week") }
    var day by remember { mutableStateOf("14") }
    var slot by remember { mutableStateOf("10:30") }
    var pw by remember { mutableStateOf("") }
    var note by remember { mutableStateOf("") }
    var code by remember { mutableStateOf("") }
    var push by remember { mutableStateOf(true) }
    var busy by remember { mutableStateOf(false) }
    var swiped by remember { mutableStateOf("—") }
    KometaWords(
        listOf(KometaWordOption("day", "Day"), KometaWordOption("week", "Week", "12"), KometaWordOption("month", "Month"), KometaWordOption("todo", "To do", "3", hot = true)),
        word, { word = it }, description = "Period",
    )
    KometaFilm(
        listOf("Mo" to "12", "Tu" to "13", "We" to "14", "Th" to "15", "Fr" to "16", "Sa" to "17", "Su" to "18").map { (s, d) ->
            KometaFilmDay(d, d, s, muted = s == "Su", dot = d == "15")
        },
        day, { day = it }, description = "Day",
    )
    KometaSlots(
        listOf(KometaSlot("9:00", "9:00"), KometaSlot("10:30", "10:30", "Ali"), KometaSlot("12:00", "12:00", disabled = true), KometaSlot("14:30", "14:30"), KometaSlot("16:00", "16:00", "last")),
        slot, { slot = it }, description = "Time",
    )
    KometaRows(label = "Account") {
        KometaRow(label = "Phone") { KometaRowValue("+998 90 123 45 67") }
        KometaRow(title = "Notifications", meta = "Bookings and reminders", tone = KometaRowTone.Amber, icon = { Label("◆") }) {
            KometaToggle(push, { push = it }, label = "Notifications")
        }
        KometaRow(title = "Language", tone = KometaRowTone.Blue, icon = { Label("A") }, onClick = {}) { BasicText("English", style = Kometa.type.body.copy(color = LocalKometaContentColor.current)) }
        KometaRow(title = "Sign out", tone = KometaRowTone.Danger, icon = { Label("!") }, onClick = {}, chevron = false)
    }
    Label("swiped: $swiped")
    KometaSwipe(rightLabel = "Done", leftLabel = "Delete", onSwipeRight = { swiped = "right" }, onSwipeLeft = { swiped = "left" }) {
        KometaPerson("Ali Valiyev", meta = "Haircut · 14:30", modifier = Modifier.padding(12.dp))
    }
    KometaField(pw, { pw = it }, label = "New password", password = true)
    KometaRules(pw, listOf(KometaRule("8+ characters") { it.length >= 8 }, KometaRule("a digit", Regex("[0-9]")), KometaRule("a capital", Regex("[A-Z]"))))
    KometaNotes(note, { note = it }, label = "Note", placeholder = "Anything the barber should know", maxLength = 60)
    Label("code = \"$code\"")
    KometaCode(code, { code = it }, label = "Code from SMS", placeholder = "·")
    KometaWord("Book this time", { busy = !busy }, lead = true, busy = busy)
    Row(horizontalArrangement = Arrangement.spacedBy(20.dp), verticalAlignment = Alignment.CenterVertically) {
        KometaWord("See all", {})
        KometaWord("Skip", {}, quiet = true, arrow = false)
        KometaErase("Delete account", {})
    }
    KometaQuiet("No bookings yet", hint = "When someone books a time with you, it shows here.") {
        KometaWord("Share your page", {})
    }
}

@Composable
private fun ColumnScope.Extra() {
    var hint by remember { mutableStateOf(false) }
    var reveal by remember { mutableIntStateOf(40) }
    var asking by remember { mutableStateOf(false) }
    var halo by remember { mutableStateOf("—") }
    val dusk = Brush.linearGradient(listOf(androidx.compose.ui.graphics.Color(0xFF3A2E5C), androidx.compose.ui.graphics.Color(0xFFE8A15A)))
    val noon = Brush.linearGradient(listOf(androidx.compose.ui.graphics.Color(0xFF2C6E8F), androidx.compose.ui.graphics.Color(0xFFB8E0D2)))
    KometaFrame(caption = "Studio, Chilonzor") { Box(Modifier.fillMaxWidth().height(110.dp).background(dusk)) }
    KometaReveal(reveal, { reveal = it }, before = { Box(Modifier.fillMaxSize().background(dusk)) }, after = { Box(Modifier.fillMaxSize().background(noon)) }, aspectRatio = 2f, description = "Before and after")
    KometaSplit(KometaSplitSide("1 240 000", "cash"), KometaSplitSide("860 000", "card"))
    KometaMarks(listOf(KometaMarkDay("Mo", "10:00\n19:00"), KometaMarkDay("Tu", "10:00\n19:00"), KometaMarkDay("We", null), KometaMarkDay("Th", "12:00\n20:00"), KometaMarkDay("Fr", "10:00\n18:00")))
    KometaTrail {
        KometaTrailStep("14:02", gap = "32 min") { BasicText("Booked online", style = Kometa.type.md.copy(color = Kometa.colors.text)) }
        KometaTrailStep("14:34", delayMs = 120) { BasicText("Arrived", style = Kometa.type.md.copy(color = Kometa.colors.text)) }
    }
    KometaHint("Lead fee", "12% of a new client's first visit, when they came from search.", hint, { hint = it })
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
        BasicText("Revenue", style = Kometa.type.md.copy(color = Kometa.colors.text))
        KometaNote("Takings for the period, before payouts.", label = "About revenue")
    }
    Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
        KometaKeys("Ctrl+Shift+P", play = true)
        BasicText("kometa.uz/ali", style = Kometa.type.md.copy(color = Kometa.colors.muted))
        KometaLink("kometa.uz/ali", "Copy", "Copied", description = "Copy page link")
    }
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
        KometaHalo({ halo = "close" }, "Close", size = KometaHaloSize.Sm) { KometaHaloGlyph("✕") }
        KometaHalo({ halo = "previous" }, "Previous") { KometaHaloGlyph("‹") }
        KometaHalo({ halo = "more" }, "More", size = KometaHaloSize.Lg) { KometaHaloGlyph("⋯") }
        Label("tapped: $halo")
    }
    KometaConfirm(asking, row = {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            KometaPerson("Ali Valiyev", meta = "Haircut · 14:30", modifier = Modifier.weight(1f))
            KometaErase("Cancel", { asking = true })
        }
    }, question = {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween, verticalAlignment = Alignment.CenterVertically) {
            BasicText("Cancel this booking?", style = Kometa.type.md.copy(color = Kometa.colors.text))
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) { KometaWord("No", { asking = false }, quiet = true, arrow = false); KometaErase("Yes, cancel", { asking = false }) }
        }
    })
}
