package uz.kometa.sample

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import uz.kometa.ui.*

// Kotlin tabs for the form pages multi … marks; see Docs.kt for how regions become docs examples.

/** 185000 -> "185 000", the way the Angular demo prints so'm. */
private fun soum(n: Int) = n.toString().reversed().chunked(3).joinToString(" ").reversed()

/** 870 (minutes past midnight) -> "14:30". */
private fun hhmm(m: Int) = "${(m / 60).toString().padStart(2, '0')}:${(m % 60).toString().padStart(2, '0')}"

// Compose has no clock in common code: the week from Monday 16 November 2026 stands in for "from today".
private val weekdays = listOf("Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun")
private fun dayAt(i: Int) = 16 + i
private fun weekdayAt(i: Int) = weekdays[i % 7]

// ---------------------------------------------------------------- multi

private data class Offer(val label: String, val value: String, val price: Int = 0, val minutes: Int = 0)

@Composable
internal fun MultiBasic() {
    // #region multi/basic
    val serviceOptions = listOf(Offer("Haircut", "cut"), Offer("Beard", "beard"), Offer("Colour", "colour"))
    val dots = mapOf("cut" to Kometa.colors.amber, "beard" to Kometa.colors.green, "colour" to Kometa.colors.violet)
    var services by remember { mutableStateOf(listOf(serviceOptions[0])) }
    KometaMulti(
        serviceOptions, services, { services = it },
        label = { it.label }, dot = { dots[it.value] }, placeholder = "Services", description = "Services",
    )
    BasicText("Services: ${services.joinToString(", ") { it.label }.ifEmpty { "—" }}", style = Kometa.type.small.copy(color = Kometa.colors.muted))
    // #endregion
}

@Composable
internal fun MultiInContext() {
    // #region multi/in-context
    val orderOptions = listOf(
        Offer("Haircut", "cut", 80000, 40), Offer("Beard trim", "beard", 40000, 20),
        Offer("Hair wash", "wash", 20000, 10), Offer("Colour", "colour", 250000, 90),
    )
    val dots = mapOf("cut" to Kometa.colors.amber, "beard" to Kometa.colors.green, "wash" to Kometa.colors.blue, "colour" to Kometa.colors.violet)
    var order by remember { mutableStateOf(listOf(orderOptions[0])) }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        KometaPerson("Malika Yusupova", meta = "Stylist · Yunusobod")
        KometaMulti(
            orderOptions, order, { order = it },
            label = { it.label }, dot = { dots[it.value] }, placeholder = "Choose services", description = "Services",
        )
        KometaButton(
            "Book · ${order.sumOf { it.minutes }} min · ${soum(order.sumOf { it.price })} so'm", {},
            Modifier.fillMaxWidth(), enabled = order.isNotEmpty(),
        )
    }
    // #endregion
}

@Composable
internal fun MultiMax() {
    // #region multi/max
    val serviceOptions = listOf("Haircut", "Beard", "Colour")
    var services by remember { mutableStateOf(listOf("Haircut")) }
    KometaMulti(serviceOptions, services, { services = it }, max = 2, placeholder = "Up to 2", description = "Limited services")
    // #endregion
}

// ---------------------------------------------------------------- menu

private val viewWords = listOf(
    KometaWordOption("day", "Day"), KometaWordOption("week", "Week", count = "12"), KometaWordOption("month", "Month", count = "3", hot = true),
)

@Composable
internal fun MenuBasic() {
    // #region menu/basic
    var view by remember { mutableStateOf("day") }
    KometaMenu(viewWords, view, { view = it }, label = "View")
    BasicText("View: $view", style = Kometa.type.small.copy(color = Kometa.colors.muted))
    // #endregion
}

@Composable
internal fun MenuInContext() {
    // #region menu/in-context
    val agendaViews = listOf(KometaWordOption("day", "Today", count = "4"), KometaWordOption("week", "This week", count = "42"))
    var agendaView by remember { mutableStateOf("day") }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        KometaHeading("Aziz's calendar") { KometaMenu(agendaViews, agendaView, { agendaView = it }, label = "Show") }
        if (agendaView == "day") {
            val agendaSlots = listOf(
                KometaSlot("10:00", "10:00", disabled = true), KometaSlot("11:30", "11:30"),
                KometaSlot("13:00", "13:00", disabled = true), KometaSlot("15:30", "15:30", note = "last"),
            )
            KometaSlots(agendaSlots, "", {}, description = "Free times today")
            BasicText("Greyed times are booked; two are still free.", style = Kometa.type.small.copy(color = Kometa.colors.muted))
        } else {
            val visits = listOf("6", "5", "7", "4", "9", "11", null)
            KometaMarks(weekdays.zip(visits) { day, n -> KometaMarkDay(day, n) }, empty = "off")
            BasicText("Visits per day; Sunday is Aziz's day off.", style = Kometa.type.small.copy(color = Kometa.colors.muted))
        }
    }
    // #endregion
}

@Composable
internal fun MenuPlaceholder() {
    // #region menu/placeholder
    var pick by remember { mutableStateOf("") }
    KometaMenu(viewWords, pick, { pick = it }, label = "Pick", placeholder = "Choose")
    // #endregion
}

// ---------------------------------------------------------------- suggest

private val people = listOf(
    KometaSuggestion("Aziz Karimov", "+998 90 123 45 67"), KometaSuggestion("Aziza Rahimova", "+998 91 765 43 21"),
    KometaSuggestion("Bekzod Aliyev", "+998 93 555 00 11"),
)

@Composable
internal fun SuggestBasic() {
    // #region suggest/basic
    var client by remember { mutableStateOf("") }
    var suggestions by remember { mutableStateOf(emptyList<KometaSuggestion>()) }
    var picked by remember { mutableStateOf("") }
    KometaSuggest(
        client, { client = it }, suggestions,
        onQuery = { q -> suggestions = people.filter { it.label.contains(q, ignoreCase = true) } },
        label = "Client", placeholder = "Type “az”", delayMillis = 100, onPick = { picked = it.label },
    )
    BasicText(if (picked.isEmpty()) "Nothing picked" else "Picked $picked", style = Kometa.type.small.copy(color = Kometa.colors.muted))
    // #endregion
}

@Composable
internal fun SuggestInContext() {
    // #region suggest/in-context
    val visitBook = listOf(
        KometaSuggestion("Dilnoza Karimova", "+998 90 123 45 67", "14 visits, last 2 weeks ago"),
        KometaSuggestion("Dilshod Ergashev", "+998 94 222 81 30", "2 visits, last in March"),
        KometaSuggestion("Aziz Rahimov", "+998 91 555 20 10", "6 visits, last yesterday"),
    )
    var visitClient by remember { mutableStateOf("") }
    var hits by remember { mutableStateOf(emptyList<KometaSuggestion>()) }
    var picked by remember { mutableStateOf<KometaSuggestion?>(null) }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        KometaSuggest(
            visitClient, { visitClient = it }, hits,
            onQuery = { q ->
                val s = q.lowercase().filterNot { it.isWhitespace() }
                hits = visitBook.filter { (it.label + it.meta).lowercase().filterNot { ch -> ch.isWhitespace() }.contains(s) }
            },
            label = "Client", placeholder = "Name or phone, try “dil”", minLength = 1, delayMillis = 100, onPick = { picked = it },
        )
        picked?.let { c ->
            KometaPerson(c.label, meta = c.meta, trailing = { KometaTag(c.data as String, tone = KometaTagTone.Done) })
            KometaButton("Book a visit for ${c.label}", {})
        }
    }
    // #endregion
}

@Composable
internal fun SuggestTemplate() {
    // #region suggest/template
    var client by remember { mutableStateOf("") }
    var suggestions by remember { mutableStateOf(emptyList<KometaSuggestion>()) }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        KometaSuggest(
            client, { client = it }, suggestions,
            onQuery = { q -> suggestions = people.filter { it.label.contains(q, ignoreCase = true) } },
            label = "Client with template", placeholder = "Type “az”",
            row = { BasicText(it.label, style = Kometa.type.md.copy(color = Kometa.colors.text)) },
        )
        KometaSuggest("Read only", {}, emptyList(), {}, label = "Read only client", readOnly = true)
    }
    // #endregion
}

// ---------------------------------------------------------------- toggle

@Composable
internal fun ToggleBasic() {
    // #region toggle/basic
    var on by remember { mutableStateOf(true) }
    KometaToggle(on, { on = it }, onLabel = "On", offLabel = "Off", label = "Demo toggle")
    // #endregion
}

@Composable
internal fun ToggleInContext() {
    // #region toggle/in-context
    var sms by remember { mutableStateOf(true) }
    var telegram by remember { mutableStateOf(true) }
    var booking by remember { mutableStateOf(true) }
    var report by remember { mutableStateOf(false) }
    KometaRows(label = "Notifications") {
        KometaRow(title = "SMS a day before", meta = "To clients, 150 so'm each", tone = KometaRowTone.Amber, chevron = false, icon = { BasicText("✉") }) {
            KometaToggle(sms, { sms = it }, label = "SMS a day before")
        }
        KometaRow(title = "Telegram reminder", meta = "Two hours before the visit", tone = KometaRowTone.Telegram, chevron = false, icon = { BasicText("✈") }) {
            KometaToggle(telegram, { telegram = it }, label = "Telegram reminder")
        }
        KometaRow(title = "New booking", meta = "To you, the moment it lands", tone = KometaRowTone.Green, chevron = false, icon = { BasicText("＋") }) {
            KometaToggle(booking, { booking = it }, label = "New booking")
        }
        KometaRow(title = "Weekly report", meta = "Mondays at 09:00", tone = KometaRowTone.Violet, chevron = false, icon = { BasicText("∑") }) {
            KometaToggle(report, { report = it }, label = "Weekly report")
        }
    }
    // #endregion
}

@Composable
internal fun ToggleLabelled() {
    // #region toggle/labelled
    var on by remember { mutableStateOf(true) }
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
        BasicText("Notifications", style = Kometa.type.body.copy(color = Kometa.colors.text))
        // Compose has no aria-labelledby: give the toggle the same words as its spoken label.
        KometaToggle(on, { on = it }, label = "Notifications")
    }
    // #endregion
}

// ---------------------------------------------------------------- check

@Composable
internal fun CheckBasic() {
    // #region check/basic
    var checked by remember { mutableStateOf(true) }
    KometaCheck("Remind me", checked, { checked = it })
    BasicText("check $checked", style = Kometa.type.small.copy(color = Kometa.colors.muted))
    // #endregion
}

private data class Prep(val text: String, val done: Boolean, val required: Boolean)

@Composable
internal fun CheckInContext() {
    // #region check/in-context
    var prep by remember {
        mutableStateOf(
            listOf(
                Prep("Patch test done 48 hours ago", done = true, required = true),
                Prep("Client agreed to the price, 250 000 so'm", done = false, required = true),
                Prep("Before photo taken", done = false, required = false),
            ),
        )
    }
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        BasicText("Before colouring · Malika Yusupova", style = Kometa.type.md.copy(color = Kometa.colors.text))
        prep.forEachIndexed { i, p ->
            KometaCheck(
                if (p.required) p.text else "${p.text} · optional", p.done,
                { done -> prep = prep.mapIndexed { j, q -> if (j == i) q.copy(done = done) else q } },
            )
        }
        KometaMeter(prep.count { it.done }, prep.size, label = "checks done", showFigure = false)
        KometaButton("Start the visit", {}, enabled = prep.all { it.done || !it.required })
    }
    // #endregion
}

@Composable
internal fun CheckReadonly() {
    // #region check/readonly
    KometaCheck("Locked", true, {}, readOnly = true)
    // #endregion
}

// ---------------------------------------------------------------- tick

@Composable
internal fun TickBasic() {
    // #region tick/basic
    var ticked by remember { mutableStateOf(false) }
    KometaTick(ticked, { ticked = it }, label = "Select row")
    BasicText("tick $ticked", style = Kometa.type.small.copy(color = Kometa.colors.muted))
    // #endregion
}

@Composable
internal fun TickInContext() {
    // #region tick/in-context
    val remindList = listOf(
        "Dilnoza Karimova" to "Haircut · tomorrow 10:00", "Aziz Rahimov" to "Beard trim · tomorrow 11:30",
        "Malika Yusupova" to "Colour · tomorrow 14:00", "Sardor Tursunov" to "Haircut · tomorrow 17:30",
    )
    var picked by remember { mutableStateOf(emptySet<String>()) }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
            KometaTick(picked.size == remindList.size, { on -> picked = if (on) remindList.map { it.first }.toSet() else emptySet() }, label = "Select all")
            BasicText(
                if (picked.isEmpty()) "Tomorrow, 4 visits" else "${picked.size} selected",
                Modifier.weight(1f), style = Kometa.type.body.copy(color = Kometa.colors.text),
            )
            KometaButton("Send SMS", {}, small = true, enabled = picked.isNotEmpty())
        }
        remindList.forEach { (name, meta) ->
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                KometaTick(name in picked, { on -> picked = if (on) picked + name else picked - name }, label = "Select $name")
                KometaPerson(name, meta = meta, size = KometaPersonSize.Sm)
            }
        }
    }
    // #endregion
}

@Composable
internal fun TickStates() {
    // #region tick/states
    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
        KometaTick(false, {}, label = "Invalid row", invalid = true)
        KometaTick(true, {}, label = "Read only row", readOnly = true)
        KometaTick(false, {}, label = "Disabled row", enabled = false)
    }
    // #endregion
}

// ---------------------------------------------------------------- chip

@Composable
internal fun ChipBasic() {
    // #region chip/basic
    var chip by remember { mutableStateOf(false) }
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        KometaChip("4.5+", chip, { chip = it }, count = "12")
        KometaChip("Disabled", false, {}, enabled = false)
    }
    // #endregion
}

private data class Barber(val name: String, val meta: String, val score: Float, val open: Boolean, val beard: Boolean)

@Composable
internal fun ChipInContext() {
    // #region chip/in-context
    val masters = listOf(
        Barber("Aziz Rahimov", "Barber · Chilonzor", 4.9f, open = true, beard = true),
        Barber("Dilnoza Karimova", "Stylist · Chilonzor", 4.7f, open = false, beard = false),
        Barber("Jasur Nazarov", "Barber · Yunusobod", 4.3f, open = true, beard = true),
        Barber("Malika Yusupova", "Stylist · Yunusobod", 4.8f, open = true, beard = false),
    )
    var open by remember { mutableStateOf(false) }
    var top by remember { mutableStateOf(false) }
    var beard by remember { mutableStateOf(false) }
    val shown = masters.filter { (!open || it.open) && (!top || it.score >= 4.5f) && (!beard || it.beard) }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            KometaChip("Open now", open, { open = it }, count = "${masters.count { it.open }}")
            KometaChip("4.5+", top, { top = it }, count = "${masters.count { it.score >= 4.5f }}")
            KometaChip("Beard", beard, { beard = it }, count = "${masters.count { it.beard }}")
        }
        shown.forEach { m -> KometaPerson(m.name, meta = m.meta, trailing = { KometaStars(m.score, "${m.score} out of 5") }) }
        if (shown.isEmpty()) KometaQuiet("No master matches", hint = "Turn a filter off to see more.")
    }
    // #endregion
}

@Composable
internal fun ChipLabel() {
    // #region chip/label
    // The chip's text is its spoken name in Compose; there is no separate override.
    var top by remember { mutableStateOf(false) }
    KometaChip("4.5+", top, { top = it })
    // #endregion
}

// ---------------------------------------------------------------- words

@Composable
internal fun WordsBasic() {
    // #region words/basic
    var view by remember { mutableStateOf("day") }
    KometaWords(viewWords, view, { view = it }, description = "View")
    // #endregion
}

@Composable
internal fun WordsInContext() {
    // #region words/in-context
    val periods = listOf(KometaWordOption("today", "Today"), KometaWordOption("week", "Week"), KometaWordOption("month", "Month"))
    val takings = mapOf(
        "today" to ("1 240 000" to "860 000"),
        "week" to ("7 900 000" to "5 300 000"),
        "month" to ("31 400 000" to "24 100 000"),
    )
    var period by remember { mutableStateOf("today") }
    val (cash, card) = takings.getValue(period)
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        KometaWords(periods, period, { period = it }, description = "Period")
        KometaSplit(KometaSplitSide(cash, "Cash"), KometaSplitSide(card, "Card"))
    }
    // #endregion
}

@Composable
internal fun WordsTabs() {
    // #region words/tabs
    var view by remember { mutableStateOf("day") }
    KometaWords(viewWords, view, { view = it }, tabs = true, description = "View tabs")
    // #endregion
}

// ---------------------------------------------------------------- rating

private val scoreWords = listOf("Bad", "Poor", "Fine", "Good", "Great")

@Composable
internal fun RatingBasic() {
    // #region rating/basic
    var rating by remember { mutableIntStateOf(4) }
    KometaRating(rating, { rating = it }, words = listOf("Bad", "Poor", "Fine", "Good", "Great"), label = "Rating")
    // #endregion
}

@Composable
internal fun RatingInContext() {
    // #region rating/in-context
    var score by remember { mutableIntStateOf(0) }
    var text by remember { mutableStateOf("") }
    var sent by remember { mutableStateOf(false) }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        if (sent) {
            KometaBanner("Thank you! Aziz will see your $score-star review.", tone = KometaBannerTone.Ok, icon = { BasicText("✓") })
            KometaWord("Write another", { sent = false; score = 0; text = "" }, quiet = true)
        } else {
            KometaPerson("Aziz Rahimov", meta = "Haircut and beard · yesterday, 18:00")
            KometaRating(score, { score = it }, words = scoreWords, label = "Your score")
            KometaNotes(text, { text = it }, label = "Review", maxLength = 300, placeholder = "What did you like? Optional")
            KometaButton("Send review", { sent = true }, enabled = score > 0)
        }
    }
    // #endregion
}

@Composable
internal fun RatingNoWord() {
    // #region rating/no-word
    var rating by remember { mutableIntStateOf(4) }
    KometaRating(rating, { rating = it }, words = scoreWords, showWord = false, label = "Rating, no word")
    // #endregion
}

// ---------------------------------------------------------------- picker

@Composable
internal fun PickerZone() {
    // #region picker/zone
    // The picker only draws the control: open the platform's file chooser in onPick.
    var picks by remember { mutableIntStateOf(0) }
    KometaPicker("Add photos", { picks++ }, variant = KometaPickerVariant.Zone, hint = "JPG or PNG")
    BasicText("Opened $picks times", style = Kometa.type.small.copy(color = Kometa.colors.muted))
    // #endregion
}

@Composable
internal fun PickerButton() {
    // #region picker/button
    var picked by remember { mutableStateOf("Nothing picked.") }
    KometaPicker("Attach file", { picked = "Open your file chooser here." })
    BasicText(picked, style = Kometa.type.small.copy(color = Kometa.colors.muted))
    // #endregion
}

@Composable
internal fun PickerForm() {
    // #region picker/form
    KometaPicker("Passport scan", {}, contentDescription = "Upload passport scan")
    // #endregion
}

// ---------------------------------------------------------------- time

@Composable
internal fun TimeBasic() {
    // #region time/basic
    // The value is minutes past midnight: 14:30 is 870.
    var time by remember { mutableStateOf<Int?>(14 * 60 + 30) }
    KometaTime(time, { time = it }, clearable = true, description = "Start time")
    BasicText("Time: ${time?.let(::hhmm) ?: "—"}", style = Kometa.type.small.copy(color = Kometa.colors.muted))
    // #endregion
}

private data class Hours(val day: String, val open: Boolean, val from: Int?, val to: Int?)

@Composable
internal fun TimeInContext() {
    // #region time/in-context
    var hours by remember {
        mutableStateOf(
            listOf(
                Hours("Mon – Fri", true, 9 * 60, 20 * 60),
                Hours("Saturday", true, 10 * 60, 18 * 60),
                Hours("Sunday", false, 10 * 60, 16 * 60),
            ),
        )
    }
    fun change(i: Int, f: (Hours) -> Hours) { hours = hours.mapIndexed { j, h -> if (j == i) f(h) else h } }
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        hours.forEachIndexed { i, h ->
            Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.CenterVertically) {
                BasicText(h.day, Modifier.width(80.dp), style = Kometa.type.body.copy(color = Kometa.colors.text))
                KometaToggle(h.open, { on -> change(i) { it.copy(open = on) } }, label = "${h.day} open")
                if (h.open) {
                    KometaTime(h.from, { t -> change(i) { it.copy(from = t) } }, description = "${h.day} opens")
                    BasicText("–", style = Kometa.type.body.copy(color = Kometa.colors.muted))
                    KometaTime(h.to, { t -> change(i) { it.copy(to = t) } }, description = "${h.day} closes")
                } else {
                    BasicText("Closed", style = Kometa.type.body.copy(color = Kometa.colors.muted))
                }
            }
        }
    }
    // #endregion
}

// ---------------------------------------------------------------- film

private val filmDays = List(7) { i ->
    KometaFilmDay("2026-11-${dayAt(i)}", "${dayAt(i)}", sub = weekdayAt(i), dot = i % 3 == 0, muted = i == 5)
}

@Composable
internal fun FilmBasic() {
    // #region film/basic
    var day by remember { mutableStateOf(filmDays[0].value) }
    KometaFilm(filmDays, day, { day = it }, description = "Day")
    BasicText("Day $day", style = Kometa.type.small.copy(color = Kometa.colors.muted))
    // #endregion
}

private data class Booking(val time: String, val who: String, val gap: String?)

@Composable
internal fun FilmInContext() {
    // #region film/in-context
    val shiftDays = List(7) { i -> KometaFilmDay("$i", "${dayAt(i)}", sub = weekdayAt(i), dot = i % 2 == 0, muted = i % 2 == 1) }
    val plans = listOf(
        listOf(
            Booking("10:00", "Dilnoza Karimova · haircut", "1 h 20 min"),
            Booking("11:20", "Aziz Rahimov · beard trim", "2 h"),
            Booking("13:20", "Malika Yusupova · colour", null),
        ),
        listOf(
            Booking("09:30", "Sardor Tursunov · haircut", "50 min"),
            Booking("10:20", "Jasur Nazarov · haircut and beard", null),
        ),
    )
    var shiftDay by remember { mutableStateOf("0") }
    val i = shiftDay.toInt()
    val visits = if (i % 2 == 1) emptyList() else plans[(i / 2) % 2]
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        KometaFilm(shiftDays, shiftDay, { shiftDay = it }, description = "Aziz's week")
        if (visits.isNotEmpty()) {
            KometaTrail {
                visits.forEach { v ->
                    KometaTrailStep(v.time, gap = v.gap) { BasicText(v.who, style = Kometa.type.body.copy(color = Kometa.colors.text)) }
                }
            }
        } else {
            KometaQuiet("Day off", hint = "Aziz does not work this day, so nothing is booked.")
        }
    }
    // #endregion
}

@Composable
internal fun FilmDisabled() {
    // #region film/disabled
    KometaFilm(filmDays, filmDays[0].value, {}, enabled = false, description = "Disabled day")
    // #endregion
}

// ---------------------------------------------------------------- slots

private val slotList = listOf(
    KometaSlot("09:00", "09:00"), KometaSlot("09:30", "09:30", disabled = true), KometaSlot("10:00", "10:00"),
    KometaSlot("10:30", "10:30", note = "last"), KometaSlot("11:00", "11:00"),
)

@Composable
internal fun SlotsBasic() {
    // #region slots/basic
    var slot by remember { mutableStateOf("") }
    KometaSlots(slotList, slot, { slot = it }, clearable = true, description = "Time slot")
    BasicText("Slot ${slot.ifEmpty { "—" }}", style = Kometa.type.small.copy(color = Kometa.colors.muted))
    // #endregion
}

@Composable
internal fun SlotsInContext() {
    // #region slots/in-context
    val pickDays = List(10) { i -> KometaFilmDay("$i", "${dayAt(i)}", sub = weekdayAt(i), muted = weekdayAt(i) == "Sun") }
    var pickDay by remember { mutableStateOf("0") }
    var pickTime by remember { mutableStateOf("") }
    val i = pickDay.toInt()
    val times = listOf("10:00", "10:45", "11:30", "13:00", "14:15", "15:00", "16:30", "18:00")
    val pickSlots = if (pickDays[i].muted) emptyList() else times.mapIndexed { j, t ->
        KometaSlot(t, t, note = if (j == 7) "last" else "", disabled = (i + j) % 3 == 0)
    }
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        KometaFilm(pickDays, pickDay, { pickDay = it; pickTime = "" }, description = "Day")
        if (pickSlots.isNotEmpty()) KometaSlots(pickSlots, pickTime, { pickTime = it }, description = "Time")
        else KometaQuiet("Closed on Sunday", hint = "Pick another day.")
        KometaButton(
            if (pickTime.isEmpty()) "Choose a time" else "Book $pickTime with Aziz", {},
            Modifier.fillMaxWidth(), enabled = pickTime.isNotEmpty(),
        )
    }
    // #endregion
}

@Composable
internal fun SlotsDisabled() {
    // #region slots/disabled
    KometaSlots(slotList, "", {}, enabled = false, description = "Disabled slots")
    // #endregion
}

// ---------------------------------------------------------------- marks

private val markWeek = listOf("M", "T", "W", "T", "F", "S", "S").mapIndexed { i, d -> KometaMarkDay(d, if (i % 2 == 1) null else "●") }

@Composable
internal fun MarksBasic() {
    // #region marks/basic
    KometaMarks(markWeek)
    // #endregion
}

@Composable
internal fun MarksInContext() {
    // #region marks/in-context
    fun week(pattern: String) = listOf("M", "T", "W", "T", "F", "S", "S").mapIndexed { i, d -> KometaMarkDay(d, if (pattern[i] == 'x') "●" else null) }
    val rota = listOf(
        Triple("Aziz Rahimov", "Barber · 6 days", true) to week("xxxxxx-"),
        Triple("Dilnoza Karimova", "Stylist · 4 days", false) to week("x-x-xx-"),
        Triple("Jasur Nazarov", "Barber · part time", true) to week("--xxx--"),
    )
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        rota.forEach { (who, days) ->
            val (name, meta, today) = who
            KometaPerson(name, meta = meta, size = KometaPersonSize.Sm, trailing = {
                KometaTag(if (today) "On shift" else "Off today", tone = if (today) KometaTagTone.Now else KometaTagTone.Wait)
            })
            KometaMarks(days, empty = "off")
        }
    }
    // #endregion
}

@Composable
internal fun MarksEmpty() {
    // #region marks/empty
    KometaMarks(markWeek, empty = "off")
    // #endregion
}

/** Every region above by its key; merged into DOC_EXAMPLES. */
internal val FORM_B_EXAMPLES = mapOf(
    "multi/basic" to DocExample(200) { MultiBasic() },
    "multi/in-context" to DocExample(260) { MultiInContext() },
    "multi/max" to DocExample(200) { MultiMax() },
    "menu/basic" to DocExample(180) { MenuBasic() },
    "menu/in-context" to DocExample(140) { MenuInContext() },
    "menu/placeholder" to DocExample(180) { MenuPlaceholder() },
    "suggest/basic" to DocExample(200) { SuggestBasic() },
    "suggest/in-context" to DocExample(200) { SuggestInContext() },
    "suggest/template" to DocExample(200) { SuggestTemplate() },
    "toggle/basic" to DocExample { ToggleBasic() },
    "toggle/in-context" to DocExample { ToggleInContext() },
    "toggle/labelled" to DocExample { ToggleLabelled() },
    "check/basic" to DocExample { CheckBasic() },
    "check/in-context" to DocExample { CheckInContext() },
    "check/readonly" to DocExample { CheckReadonly() },
    "tick/basic" to DocExample { TickBasic() },
    "tick/in-context" to DocExample { TickInContext() },
    "tick/states" to DocExample { TickStates() },
    "chip/basic" to DocExample { ChipBasic() },
    "chip/in-context" to DocExample { ChipInContext() },
    "chip/label" to DocExample { ChipLabel() },
    "words/basic" to DocExample { WordsBasic() },
    "words/in-context" to DocExample { WordsInContext() },
    "words/tabs" to DocExample { WordsTabs() },
    "rating/basic" to DocExample { RatingBasic() },
    "rating/in-context" to DocExample { RatingInContext() },
    "rating/no-word" to DocExample { RatingNoWord() },
    "picker/zone" to DocExample { PickerZone() },
    "picker/button" to DocExample { PickerButton() },
    "picker/form" to DocExample { PickerForm() },
    "time/basic" to DocExample(320) { TimeBasic() },
    "time/in-context" to DocExample(320) { TimeInContext() },
    "film/basic" to DocExample { FilmBasic() },
    "film/in-context" to DocExample { FilmInContext() },
    "film/disabled" to DocExample { FilmDisabled() },
    "slots/basic" to DocExample { SlotsBasic() },
    "slots/in-context" to DocExample { SlotsInContext() },
    "slots/disabled" to DocExample { SlotsDisabled() },
    "marks/basic" to DocExample { MarksBasic() },
    "marks/in-context" to DocExample { MarksInContext() },
    "marks/empty" to DocExample { MarksEmpty() },
)
