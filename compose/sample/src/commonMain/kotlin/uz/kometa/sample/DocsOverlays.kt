package uz.kometa.sample

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableLongStateOf
import androidx.compose.runtime.mutableStateListOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay
import uz.kometa.ui.*

// Kotlin tabs for the overlay and status pages (drawer, pop, tip, hint, note, context, tag, badge,
// banner, toast, upload); see Docs.kt for how a `// #region page/id` reaches the docs site.

/** 80000 as "80 000", the way the Angular examples print so'm. */
private fun spaced(n: Int) = n.toString().reversed().chunked(3).joinToString(" ").reversed()

@Composable
internal fun DrawerBasic() {
    // #region drawer/basic
    var drawer by remember { mutableStateOf(false) }
    var sheet by remember { mutableStateOf(false) }
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        KometaButton("Right drawer", { drawer = true }, severity = KometaSeverity.Secondary)
        KometaButton("Bottom sheet", { sheet = true }, severity = KometaSeverity.Secondary)
    }
    KometaDrawer(drawer, { drawer = false }, position = KometaDrawerPosition.Right, label = "Demo drawer") {
        Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            BasicText("Drawer", style = Kometa.type.title.copy(color = Kometa.colors.text))
            BasicText("Back or the dark area closes it.", style = Kometa.type.md.copy(color = Kometa.colors.muted))
            KometaButton("Close", { drawer = false })
        }
    }
    KometaDrawer(sheet, { sheet = false }, label = "Demo sheet") {
        Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            BasicText("Bottom sheet", style = Kometa.type.title.copy(color = Kometa.colors.text))
            BasicText("Slides up from the bottom.", style = Kometa.type.md.copy(color = Kometa.colors.muted))
        }
    }
    // #endregion
}

private data class BagItem(val name: String, val who: String, val price: Int)

@Composable
internal fun DrawerInContext() {
    // #region drawer/in-context
    var open by remember { mutableStateOf(false) }
    val bag = remember {
        mutableStateListOf(
            BagItem("Haircut", "Aziz Rahimov", 80000),
            BagItem("Beard trim", "Aziz Rahimov", 40000),
            BagItem("Manicure", "Malika Yusupova", 90000),
        )
    }
    KometaButton("Your visit · ${bag.size}", { open = true }, severity = KometaSeverity.Secondary)
    KometaDrawer(open, { open = false }, position = KometaDrawerPosition.Right, label = "Your visit") {
        Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
            BasicText("Your visit, Friday 11:00", style = Kometa.type.title.copy(color = Kometa.colors.text))
            bag.toList().forEach { item ->
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    Column(Modifier.weight(1f)) {
                        BasicText(item.name, style = Kometa.type.md.copy(color = Kometa.colors.text))
                        BasicText(item.who, style = Kometa.type.small.copy(color = Kometa.colors.muted))
                    }
                    BasicText(spaced(item.price), style = Kometa.type.mono.copy(color = Kometa.colors.text))
                    KometaHalo({ bag.remove(item) }, "Remove ${item.name}", size = KometaHaloSize.Sm) { KometaHaloGlyph("✕") }
                }
            }
            if (bag.isEmpty()) KometaQuiet("Nothing here", hint = "Add a service to book a visit.")
            KometaButton("Book · ${spaced(bag.sumOf { it.price })} so'm", { open = false }, Modifier.fillMaxWidth(), enabled = bag.isNotEmpty())
        }
    }
    // #endregion
}

@Composable
internal fun DrawerFilters() {
    // #region drawer/filters
    var open by remember { mutableStateOf(false) }
    var day by remember { mutableStateOf("any") }
    var openNow by remember { mutableStateOf(false) }
    var top by remember { mutableStateOf(true) }
    KometaButton("Filters", { open = true }, severity = KometaSeverity.Secondary, variant = KometaButtonVariant.Outlined)
    KometaDrawer(open, { open = false }, label = "Filters") {
        Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
            BasicText("Find a master", style = Kometa.type.title.copy(color = Kometa.colors.text))
            KometaWords(
                listOf(KometaWordOption("any", "Any day"), KometaWordOption("today", "Today"), KometaWordOption("tomorrow", "Tomorrow")),
                day, { day = it }, description = "Day",
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                KometaChip("Open now", openNow, { openNow = it })
                KometaChip("4.5+", top, { top = it })
            }
            KometaButton("Show 14 masters", { open = false }, Modifier.fillMaxWidth())
        }
    }
    // #endregion
}

@Composable
internal fun PopBasic() {
    // #region pop/basic
    var open by remember { mutableStateOf(false) }
    Box {
        KometaButton("Pop", { open = !open }, severity = KometaSeverity.Secondary)
        KometaPop(open, { open = it }, label = "Shop", width = 240.dp) {
            BasicText("A small panel hung off the button.", Modifier.padding(12.dp), style = Kometa.type.md.copy(color = Kometa.colors.text))
        }
    }
    // #endregion
}

private data class Shop(val name: String, val meta: String)

@Composable
internal fun PopInContext() {
    // #region pop/in-context
    val shops = listOf(
        Shop("Kometa Chilonzor", "Bunyodkor avenue 12"),
        Shop("Kometa Yunusobod", "Amir Temur street 108"),
        Shop("Kometa Samarkand", "Registan street 5"),
    )
    var shop by remember { mutableStateOf(shops[0]) }
    var open by remember { mutableStateOf(false) }
    Box {
        KometaButton(shop.name, { open = !open }, severity = KometaSeverity.Secondary, iconRight = true, icon = { BasicText("▾") })
        KometaPop(open, { open = it }, label = "Choose a shop", width = 300.dp) {
            shops.forEach { s ->
                KometaPerson(
                    s.name, Modifier.fillMaxWidth().clickable { shop = s; open = false }.padding(8.dp),
                    meta = s.meta, size = KometaPersonSize.Sm, square = true,
                )
            }
        }
    }
    // #endregion
}

@Composable
internal fun PopAlign() {
    // #region pop/align
    var open by remember { mutableStateOf(false) }
    Box {
        KometaButton("Pop (end, 24dp)", { open = !open }, severity = KometaSeverity.Secondary)
        KometaPop(open, { open = it }, label = "Shop", width = 240.dp, offset = 24.dp, align = KometaPopAlign.End) {
            BasicText("Right edge, 24dp away.", Modifier.padding(12.dp), style = Kometa.type.md.copy(color = Kometa.colors.text))
        }
    }
    // #endregion
}

@Composable
internal fun TipBasic() {
    // #region tip/basic
    KometaTip("A tooltip", sub = "With a second line") {
        KometaWord("Hover me", {}, quiet = true)
    }
    // #endregion
}

private data class DayLoad(val day: String, val visits: Int, val sum: String)

@Composable
internal fun TipInContext() {
    // #region tip/in-context
    val load = listOf(
        DayLoad("Mon", 14, "1 120 000 so'm"), DayLoad("Tue", 9, "720 000 so'm"),
        DayLoad("Wed", 17, "1 410 000 so'm"), DayLoad("Thu", 12, "950 000 so'm"),
        DayLoad("Fri", 21, "1 830 000 so'm"), DayLoad("Sat", 24, "2 060 000 so'm"),
        DayLoad("Sun", 6, "480 000 so'm"),
    )
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        KometaHeading("Visits this week")
        Row(horizontalArrangement = Arrangement.spacedBy(10.dp), verticalAlignment = Alignment.Bottom) {
            load.forEach { d ->
                KometaTip("${d.day}: ${d.visits} visits", sub = d.sum) {
                    Column(horizontalAlignment = Alignment.CenterHorizontally, verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Box(Modifier.width(24.dp).height((d.visits * 4).dp).background(Kometa.colors.amber))
                        BasicText(d.day, style = Kometa.type.small.copy(color = Kometa.colors.muted))
                    }
                }
            }
        }
    }
    // #endregion
}

@Composable
internal fun TipDelay() {
    // #region tip/delay
    KometaTip("Shows after 1.2 s", delayMs = 1200) {
        KometaWord("Slow tip", {}, quiet = true)
    }
    // #endregion
}

@Composable
internal fun HintBasic() {
    // #region hint/basic
    var open by remember { mutableStateOf(false) }
    KometaHint("Lead fee", "12% of a new client's first visit.", open, { open = it })
    // #endregion
}

@Composable
internal fun HintInContext() {
    // #region hint/in-context
    var leadFee by remember { mutableStateOf(false) }
    var acquiring by remember { mutableStateOf(false) }
    val text = Kometa.type.md.copy(color = Kometa.colors.text)
    val money = Kometa.type.mono.copy(color = Kometa.colors.text)
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        KometaHeading("Payout for October")
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            BasicText("Visits paid online", Modifier.weight(1f), style = text)
            BasicText("4 820 000 so'm", style = money)
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            KometaHint(
                "Lead fee", "12% of a new client's first visit, for clients Kometa brought you.",
                leadFee, { leadFee = it }, Modifier.weight(1f),
            )
            BasicText("− 186 000 so'm", style = money)
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            KometaHint("Acquiring", "The 1.5% Click and Payme keep for card payments.", acquiring, { acquiring = it }, Modifier.weight(1f))
            BasicText("− 72 300 so'm", style = money)
        }
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            BasicText("To your card", Modifier.weight(1f), style = text)
            BasicText("4 561 700 so'm", style = money)
        }
        KometaButton("Withdraw", {}, small = true)
    }
    // #endregion
}

@Composable
internal fun HintDisabled() {
    // #region hint/disabled
    KometaHint("Lead fee", "12% of a new client's first visit.", false, {}, enabled = false)
    // #endregion
}

@Composable
internal fun NoteBasic() {
    // #region note/basic
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        BasicText("Revenue", style = Kometa.type.md.copy(color = Kometa.colors.text))
        KometaNote("Takings for the period, before payouts.", label = "About revenue")
    }
    // #endregion
}

private data class Kpi(val label: String, val note: String, val figure: String, val tag: String, val tone: KometaTagTone)

@Composable
internal fun NoteInContext() {
    // #region note/in-context
    val kpis = listOf(
        Kpi("Revenue", "Takings for the week, before payouts and fees.", "8 570 000", "+12% on last week", KometaTagTone.Done),
        Kpi("Load", "Booked minutes out of all the working minutes of your masters.", "74%", "Same as last week", KometaTagTone.Wait),
        Kpi("No-shows", "Visits where the client neither came nor cancelled.", "3", "+2 on last week", KometaTagTone.Warn),
    )
    Row(horizontalArrangement = Arrangement.spacedBy(24.dp)) {
        kpis.forEach { k ->
            Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
                    BasicText(k.label, style = Kometa.type.small.copy(color = Kometa.colors.muted))
                    KometaNote(k.note, label = "About ${k.label.lowercase()}")
                }
                BasicText(k.figure, style = Kometa.type.title.copy(color = Kometa.colors.text))
                KometaTag(k.tag, tone = k.tone)
            }
        }
    }
    // #endregion
}

@Composable
internal fun NotePlacement() {
    // #region note/placement
    Row(verticalAlignment = Alignment.CenterVertically, horizontalArrangement = Arrangement.spacedBy(4.dp)) {
        BasicText("Revenue", style = Kometa.type.md.copy(color = Kometa.colors.text))
        KometaNote("Always opens below.", label = "About revenue", placement = KometaNotePlacement.Below)
    }
    // #endregion
}

private val visitActions = listOf(
    KometaContextItem("Reschedule", shortcut = "R"),
    KometaContextItem("Duplicate", shortcut = "Ctrl D"),
    KometaContextItem("Send reminder"),
    null,
    KometaContextItem("Cancel visit", shortcut = "Del", danger = true),
)

@Composable
internal fun ContextBasic() {
    // #region context/basic
    // visitActions: Reschedule (R), Duplicate (Ctrl D), Send reminder, a divider (null), Cancel visit (Del, danger)
    var picked by remember { mutableStateOf("") }
    KometaContext(visitActions, { picked = it.label }) {
        Column(Modifier.fillMaxWidth(), verticalArrangement = Arrangement.spacedBy(8.dp)) {
            BasicText("10:00  Anvar K. · Haircut", style = Kometa.type.md.copy(color = Kometa.colors.text))
            BasicText("11:30  Malika R. · Colour", style = Kometa.type.md.copy(color = Kometa.colors.text))
        }
    }
    BasicText("Picked: $picked", style = Kometa.type.small.copy(color = Kometa.colors.muted))
    // #endregion
}

private data class DayVisit(val time: String, val who: String, val state: String = "Booked", val tone: KometaTagTone = KometaTagTone.Book)

@Composable
internal fun ContextInContext() {
    // #region context/in-context
    val visits = remember {
        mutableStateListOf(
            DayVisit("10:00", "Anvar K. · Haircut"),
            DayVisit("11:30", "Malika R. · Colour"),
            DayVisit("13:00", "Zafar T. · Shave"),
        )
    }
    var said by remember { mutableStateOf("") }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        visits.forEachIndexed { i, v ->
            KometaContext(visitActions, { action ->
                if (action.label == "Cancel visit") visits[i] = v.copy(state = "Cancelled", tone = KometaTagTone.Warn)
                said = "${action.label} · ${v.time}"
            }) {
                Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    BasicText(v.time, style = Kometa.type.mono.copy(color = Kometa.colors.text))
                    BasicText(v.who, Modifier.weight(1f), style = Kometa.type.md.copy(color = Kometa.colors.text))
                    KometaTag(v.state, tone = v.tone)
                }
            }
        }
        BasicText(said, style = Kometa.type.small.copy(color = Kometa.colors.muted))
    }
    // #endregion
}

@Composable
internal fun TagTones() {
    // #region tag/tones
    Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
        KometaTagTone.entries.forEach { KometaTag(it.name.lowercase(), tone = it) }
    }
    // #endregion
}

private data class Visit(val time: String, val name: String, val service: String, val tone: KometaTagTone, val word: String)

@Composable
internal fun TagInContext() {
    // #region tag/in-context
    val visits = listOf(
        Visit("09:00", "Dilnoza Karimova", "Haircut", KometaTagTone.Done, "Done"),
        Visit("10:30", "Aziz Rahimov", "Beard trim", KometaTagTone.Now, "In the chair"),
        Visit("11:15", "Sardor Tursunov", "Haircut", KometaTagTone.Warn, "Late 15 min"),
        Visit("13:00", "Malika Yusupova", "Colour", KometaTagTone.Book, "Booked"),
        Visit("15:30", "Nodira Saidova", "Manicure", KometaTagTone.Wait, "Unconfirmed"),
        Visit("17:00", "Jasur Nazarov", "Haircut and beard", KometaTagTone.Error, "Cancelled"),
    )
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        visits.forEach { v ->
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                BasicText(v.time, style = Kometa.type.mono.copy(color = Kometa.colors.text))
                KometaPerson(v.name, Modifier.weight(1f), meta = v.service, size = KometaPersonSize.Sm)
                KometaTag(v.word, tone = v.tone)
            }
        }
    }
    // #endregion
}

@Composable
internal fun TagNoDot() {
    // #region tag/no-dot
    Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
        KometaTagTone.entries.forEach { KometaTag(it.name.lowercase(), tone = it, dot = false) }
    }
    // #endregion
}

@Composable
internal fun BadgeBasic() {
    // #region badge/basic
    var unread by remember { mutableIntStateOf(3) }
    Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
        KometaBadge(unread, label = "{n} unread") {
            KometaHalo({}, "Notifications") { KometaHaloGlyph("✉") }
        }
        KometaWord("Add one", { unread++ })
        KometaWord("Clear", { unread = 0 }, quiet = true)
    }
    // #endregion
}

@Composable
internal fun BadgeInContext() {
    // #region badge/in-context
    var bookings by remember { mutableIntStateOf(2) }
    var messages by remember { mutableIntStateOf(5) }
    Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
        BasicText("Today", Modifier.weight(1f), style = Kometa.type.title.copy(color = Kometa.colors.text))
        KometaBadge(bookings, label = "{n} new bookings") {
            KometaHalo({ bookings = 0 }, "Bookings") { KometaHaloGlyph("◷") }
        }
        KometaBadge(messages, label = "{n} unread") {
            KometaHalo({ messages = 0 }, "Messages") { KometaHaloGlyph("✉") }
        }
        KometaWord("Simulate a booking", { bookings++ }, quiet = true)
    }
    // #endregion
}

@Composable
internal fun BadgeMax() {
    // #region badge/badge-max
    Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
        KometaBadge(140) { KometaHalo({}, "Messages") { KometaHaloGlyph("✉") } }
        KometaBadge(12, max = 9) { KometaHalo({}, "Waitlist") { KometaHaloGlyph("☰") } }
        KometaBadge(0, showZero = true) { KometaHalo({}, "Reviews") { KometaHaloGlyph("★") } }
    }
    // #endregion
}

@Composable
internal fun BannerTones() {
    // #region banner/tones
    val shown = remember { mutableStateListOf(*KometaBannerTone.entries.toTypedArray()) }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        shown.toList().forEach { tone ->
            key(tone) {
                KometaBanner("This is a ${tone.name.lowercase()} banner.", tone = tone, onDismiss = { shown.remove(tone) })
            }
        }
    }
    // #endregion
}

@Composable
internal fun BannerInContext() {
    // #region banner/in-context
    var steps by remember { mutableIntStateOf(3) }
    var hidden by remember { mutableStateOf(false) }
    val glyph = @Composable { g: String -> BasicText(g, style = Kometa.type.md.copy(color = LocalKometaContentColor.current)) }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        KometaPerson("Kometa Chilonzor", meta = "Your shop page", size = KometaPersonSize.Lg, square = true)
        KometaMeter(steps, 5, label = "setup steps done")
        if (steps < 5) {
            KometaBanner(
                if (steps < 4) "Shops with photos get twice as many bookings." else "Clients cannot book until your hours are set.",
                tone = KometaBannerTone.Warn, icon = { glyph("!") },
                actionLabel = if (steps < 4) "Add photos" else "Set hours", onAction = { steps++ },
            )
        } else if (!hidden) {
            KometaBanner(
                "Your page is complete and open for booking.",
                tone = KometaBannerTone.Ok, icon = { glyph("✓") }, onDismiss = { hidden = true },
            )
        }
    }
    // #endregion
}

@Composable
internal fun BannerIcon() {
    // #region banner/icon
    KometaBanner("Check the schedule before you confirm.", tone = KometaBannerTone.Warn, icon = {
        // The icon slot provides the tone colour.
        BasicText("!", style = Kometa.type.md.copy(color = LocalKometaContentColor.current))
    })
    // #endregion
}

@Composable
internal fun ToastKinds() {
    // #region toast/kinds
    val toasts = remember { mutableStateListOf<KometaToastItem>() }
    var nextId by remember { mutableLongStateOf(0L) }
    fun toast(kind: KometaToastKind) {
        toasts += KometaToastItem(++nextId, "A ${kind.name.lowercase()} message.", kind, life = 4000)
    }
    // Toasts stack over the screen: put them in a Box with the content they cover.
    Box(Modifier.fillMaxWidth().height(240.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            KometaButton("Success", { toast(KometaToastKind.Success) }, small = true)
            KometaButton("Info", { toast(KometaToastKind.Info) }, small = true, severity = KometaSeverity.Secondary)
            KometaButton("Warn", { toast(KometaToastKind.Warn) }, small = true, severity = KometaSeverity.Secondary)
            KometaButton("Error", { toast(KometaToastKind.Error) }, small = true, severity = KometaSeverity.Danger)
        }
        KometaToasts(toasts, { id -> toasts.removeAll { it.id == id } }, Modifier.align(Alignment.BottomCenter))
    }
    // #endregion
}

@Composable
internal fun ToastInContext() {
    // #region toast/in-context
    val toasts = remember { mutableStateListOf<KometaToastItem>() }
    var nextId by remember { mutableLongStateOf(0L) }
    fun notify(kind: KometaToastKind, text: String) {
        toasts += KometaToastItem(++nextId, text, kind)
    }
    Box(Modifier.fillMaxWidth().height(280.dp)) {
        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
            KometaPerson("Aziz Rahimov", meta = "Beard trim · today 11:30")
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                KometaButton("Remind", { notify(KometaToastKind.Success, "Reminder sent to Aziz by Telegram.") }, small = true, severity = KometaSeverity.Secondary)
                KometaButton("Move to 12:00", { notify(KometaToastKind.Info, "Moved to 12:00. Aziz gets an SMS.") }, small = true, severity = KometaSeverity.Secondary)
                KometaButton("Charge 40 000", { notify(KometaToastKind.Warn, "Click is slow today; the payment may take a minute.") }, small = true)
                KometaButton(
                    "No-show", { notify(KometaToastKind.Error, "Aziz is marked as a no-show.") },
                    small = true, severity = KometaSeverity.Danger, variant = KometaButtonVariant.Outlined,
                )
            }
        }
        KometaToasts(toasts, { id -> toasts.removeAll { it.id == id } }, Modifier.align(Alignment.BottomCenter))
    }
    // #endregion
}

@Composable
internal fun ToastPosition() {
    // #region toast/position
    val toasts = remember { mutableStateListOf<KometaToastItem>() }
    Box(Modifier.fillMaxWidth().height(160.dp)) {
        KometaButton(
            "Top toast", { toasts.clear(); toasts += KometaToastItem(1, "From the top.", KometaToastKind.Info, life = 3000) },
            Modifier.align(Alignment.BottomStart), small = true, severity = KometaSeverity.Secondary,
        )
        KometaToasts(toasts, { toasts.clear() }, Modifier.align(Alignment.TopCenter), top = true)
    }
    // #endregion
}

@Composable
internal fun UploadStates() {
    // #region upload/states
    var retried by remember { mutableIntStateOf(0) }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        KometaUpload("receipt.pdf", sizeLabel = "1.2 MB", progress = .45f, state = KometaUploadState.Running, statusLabel = "45%")
        KometaUpload("photo.jpg", sizeLabel = "820 KB", progress = 1f, state = KometaUploadState.Done, statusLabel = "Uploaded")
        KometaUpload(
            "scan.png", sizeLabel = "4.1 MB", state = KometaUploadState.Failed, statusLabel = "Too large",
            actionLabel = "Retry", onAction = { retried++ },
        )
        BasicText("Retried $retried times.", style = Kometa.type.small.copy(color = Kometa.colors.muted))
    }
    // #endregion
}

@Composable
internal fun UploadInContext() {
    // #region upload/in-context
    var state by remember { mutableStateOf(KometaUploadState.Idle) }
    var progress by remember { mutableFloatStateOf(0f) }
    // The caller runs the upload; here a timer stands in for the file being read.
    LaunchedEffect(state) {
        if (state == KometaUploadState.Running) {
            while (progress < 1f) { delay(250); progress = minOf(1f, progress + .15f) }
            state = KometaUploadState.Done
        }
    }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        KometaHeading("Bring your clients to Kometa")
        if (state != KometaUploadState.Idle) {
            KometaUpload(
                "clients-from-excel.csv", sizeLabel = "48 KB · 312 rows", progress = progress, state = state,
                statusLabel = if (state == KometaUploadState.Done) "Imported" else "Reading rows",
            )
        }
        if (state == KometaUploadState.Done) {
            KometaBanner("312 clients imported, 4 duplicates merged.", tone = KometaBannerTone.Ok, actionLabel = "Open clients")
        } else {
            KometaButton(
                "Import clients-from-excel.csv", { progress = 0f; state = KometaUploadState.Running },
                loading = state == KometaUploadState.Running,
            )
        }
    }
    // #endregion
}

@Composable
internal fun UploadNoPercent() {
    // #region upload/no-percent
    KometaUpload("video.mp4", sizeLabel = "48 MB", progress = .6f, state = KometaUploadState.Running, statusLabel = "60%", showPercent = false)
    // #endregion
}

/** This file's regions by key, merged into DOC_EXAMPLES. */
internal val OVERLAYS_EXAMPLES = mapOf(
    "drawer/basic" to DocExample { DrawerBasic() },
    "drawer/in-context" to DocExample { DrawerInContext() },
    "drawer/filters" to DocExample { DrawerFilters() },
    "pop/basic" to DocExample(80) { PopBasic() },
    "pop/in-context" to DocExample(200) { PopInContext() },
    "pop/align" to DocExample(100) { PopAlign() },
    "tip/basic" to DocExample(40) { TipBasic() },
    "tip/in-context" to DocExample(40) { TipInContext() },
    "tip/delay" to DocExample(40) { TipDelay() },
    "hint/basic" to DocExample(40) { HintBasic() },
    "hint/in-context" to DocExample(80) { HintInContext() },
    "hint/disabled" to DocExample { HintDisabled() },
    "note/basic" to DocExample(80) { NoteBasic() },
    "note/in-context" to DocExample(80) { NoteInContext() },
    "note/placement" to DocExample(80) { NotePlacement() },
    "context/basic" to DocExample(180) { ContextBasic() },
    "context/in-context" to DocExample(180) { ContextInContext() },
    "tag/tones" to DocExample { TagTones() },
    "tag/in-context" to DocExample { TagInContext() },
    "tag/no-dot" to DocExample { TagNoDot() },
    "badge/basic" to DocExample { BadgeBasic() },
    "badge/in-context" to DocExample { BadgeInContext() },
    "badge/badge-max" to DocExample { BadgeMax() },
    "banner/tones" to DocExample { BannerTones() },
    "banner/in-context" to DocExample(40) { BannerInContext() },
    "banner/icon" to DocExample { BannerIcon() },
    "toast/kinds" to DocExample { ToastKinds() },
    "toast/in-context" to DocExample { ToastInContext() },
    "toast/position" to DocExample { ToastPosition() },
    "upload/states" to DocExample { UploadStates() },
    "upload/in-context" to DocExample(200) { UploadInContext() },
    "upload/no-percent" to DocExample { UploadNoPercent() },
)
