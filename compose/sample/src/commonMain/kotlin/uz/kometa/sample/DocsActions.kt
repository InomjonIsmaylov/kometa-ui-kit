package uz.kometa.sample

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
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

// The docs site's Kotlin tabs for the action, disclosure and navigation pages (see Docs.kt).

@Composable
private fun Muted(text: String) = BasicText(text, style = Kometa.type.small.copy(color = Kometa.colors.muted))

@Composable
private fun Body(text: String, modifier: Modifier = Modifier) = BasicText(text, modifier, style = Kometa.type.body.copy(color = Kometa.colors.text))

// ---------------------------------------------------------------- word

@Composable
internal fun WordBasic() {
    // #region word/basic
    var said by remember { mutableStateOf("") }
    Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
        KometaWord("Nudge", { said = "Word" })
        KometaWord("Later", {}, quiet = true)
        KometaWord("Book a visit", {}, lead = true)
        KometaWord("Saving", {}, lead = true, busy = true, busyLabel = "Saving")
    }
    Muted(said)
    // #endregion
}

@Composable
internal fun WordInContext() {
    // #region word/in-context
    var visit by remember { mutableStateOf("book") }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            KometaPerson("Dilnoza Karimova", Modifier.weight(1f), meta = "Haircut · 14:30 · 80 000 so'm")
            when (visit) {
                "book" -> KometaTag("Booked", tone = KometaTagTone.Book)
                "now" -> KometaTag("In the chair", tone = KometaTagTone.Now)
                else -> KometaTag("Done", tone = KometaTagTone.Done)
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
            when (visit) {
                "book" -> {
                    KometaWord("Start visit", { visit = "now" }, Modifier.weight(1f), lead = true)
                    KometaWord("Move", {}, quiet = true)
                }
                "now" -> KometaWord("Finish and take payment", { visit = "done" }, Modifier.weight(1f), lead = true)
                else -> KometaWord("Undo", { visit = "book" }, quiet = true, arrow = false)
            }
        }
    }
    // #endregion
}

@Composable
internal fun WordArrow() {
    // #region word/arrow
    KometaWord("Plain word", {}, arrow = false)
    // #endregion
}

// ---------------------------------------------------------------- erase

@Composable
internal fun EraseBasic() {
    // #region erase/basic
    var said by remember { mutableStateOf("") }
    KometaErase("Delete service", { said = "Erase" })
    Muted(said)
    // #endregion
}

private data class ActService(val name: String, val price: String)

@Composable
internal fun EraseInContext() {
    // #region erase/in-context
    var services by remember {
        mutableStateOf(listOf(ActService("Haircut", "80 000 so'm"), ActService("Beard trim", "40 000 so'm"), ActService("Kids haircut", "60 000 so'm")))
    }
    var deleting by remember { mutableStateOf<String?>(null) }
    if (services.isEmpty()) KometaQuiet("No services", hint = "Add one so clients can book.")
    else KometaRows(label = "Services") {
        services.forEach { s ->
            KometaRow(label = s.name) {
                KometaRowValue(s.price)
                KometaErase("Delete", { deleting = s.name })
            }
        }
    }
    KometaTray(
        deleting?.let {
            KometaConfirmation(
                "Delete", "Keep it", header = "Delete “$it”?",
                message = "Clients can no longer book it. Past visits keep their records.", danger = true,
            )
        },
        onAccept = { services = services.filter { it.name != deleting }; deleting = null },
        onReject = { deleting = null },
    )
    // #endregion
}

// ---------------------------------------------------------------- halo

@Composable
internal fun HaloBasic() {
    // #region halo/basic
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        KometaHalo({}, "Close") { KometaHaloGlyph("✕") }
        KometaHalo({}, "More") { KometaHaloGlyph("⋯") }
    }
    // #endregion
}

@Composable
internal fun HaloInContext() {
    // #region halo/in-context
    var said by remember { mutableStateOf("") }
    Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
        KometaHalo({ said = "Back" }, "Back") { KometaHaloGlyph("‹") }
        KometaPerson("Malika Yusupova", Modifier.weight(1f), meta = "Colour · Fri 11:00", size = KometaPersonSize.Sm)
        KometaHalo({ said = "Calling +998 93 410 77 02" }, "Call Malika", size = KometaHaloSize.Sm) { KometaHaloGlyph("☎") }
        KometaHalo({ said = "Telegram opened" }, "Message Malika", size = KometaHaloSize.Sm) { KometaHaloGlyph("✉") }
    }
    Muted(said)
    // #endregion
}

@Composable
internal fun HaloSize() {
    // #region halo/halo-size
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
        KometaHalo({}, "Small", size = KometaHaloSize.Sm) { KometaHaloGlyph("✕") }
        KometaHalo({}, "Large", size = KometaHaloSize.Lg) { KometaHaloGlyph("✕") }
    }
    // #endregion
}

// ---------------------------------------------------------------- fab

private val fabActions = listOf(
    KometaFabAction("New visit", "visit"),
    KometaFabAction("Block time", "block"),
    KometaFabAction("Add client", "client"),
)

@Composable
internal fun FabBasic() {
    // #region fab/basic
    var open by remember { mutableStateOf(false) }
    var picked by remember { mutableStateOf("") }
    // The fab fills its parent: a full-screen Box for the page's fab, a card's Box for an inline one.
    Box(Modifier.fillMaxWidth().height(240.dp)) {
        Muted(if (picked.isEmpty()) "" else "Picked $picked")
        KometaFab(fabActions, open, { open = it }, { picked = it.label }, label = "Create")
    }
    // #endregion
}

private data class ActSwipeVisit(val time: String, val name: String, val service: String)

@Composable
internal fun FabInContext() {
    // #region fab/in-context
    val visits = listOf(
        ActSwipeVisit("10:00", "Anvar K.", "Haircut"),
        ActSwipeVisit("11:30", "Dilnoza S.", "Fade"),
        ActSwipeVisit("13:00", "Jasur M.", "Beard trim"),
        ActSwipeVisit("15:00", "Madina A.", "Kids cut"),
    )
    var open by remember { mutableStateOf(false) }
    Box(Modifier.fillMaxWidth().height(260.dp)) {
        Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            BasicText("Today · ${visits.size} visits", style = Kometa.type.md.copy(color = Kometa.colors.text))
            visits.forEach { Body("${it.time}  ${it.name} · ${it.service}") }
        }
        KometaFab(fabActions, open, { open = it }, {}, label = "Add to today")
    }
    // #endregion
}

// ---------------------------------------------------------------- actions

@Composable
internal fun ActionsBasic() {
    // #region actions/basic
    var open by remember { mutableStateOf(false) }
    var said by remember { mutableStateOf("") }
    val actions = listOf(
        KometaAction("Edit") { said = "Edit chosen" },
        KometaAction("Export", badge = "PRO") { said = "Export chosen" },
        KometaAction("Archive", enabled = false) {},
        KometaAction("Cancel visit", danger = true) { said = "Cancel chosen" },
    )
    KometaActions(actions, "Visit actions", open, { open = it })
    Muted(said)
    // #endregion
}

private data class ActQueueVisit(val id: Int, val time: String, val name: String, val service: String, val status: KometaTagTone)

private val queueWords = mapOf(
    KometaTagTone.Book to "Booked", KometaTagTone.Wait to "Unconfirmed", KometaTagTone.Now to "In the chair",
    KometaTagTone.Done to "Done", KometaTagTone.Error to "Cancelled", KometaTagTone.Warn to "Late",
)

@Composable
internal fun ActionsInContext() {
    // #region actions/in-context
    var queue by remember {
        mutableStateOf(listOf(
            ActQueueVisit(1, "10:00", "Dilnoza Karimova", "Haircut", KometaTagTone.Book),
            ActQueueVisit(2, "11:30", "Aziz Rahimov", "Beard trim", KometaTagTone.Wait),
            ActQueueVisit(3, "13:00", "Sardor Tursunov", "Haircut and beard", KometaTagTone.Book),
        ))
    }
    var openId by remember { mutableStateOf<Int?>(null) }
    fun set(id: Int, status: KometaTagTone) { queue = queue.map { if (it.id == id) it.copy(status = status) else it } }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        queue.forEach { v ->
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                BasicText(v.time, style = Kometa.type.md.copy(color = Kometa.colors.text))
                KometaPerson(v.name, Modifier.weight(1f), meta = v.service, size = KometaPersonSize.Sm)
                KometaTag(queueWords.getValue(v.status), tone = v.status)
                KometaActions(
                    listOf(
                        KometaAction("Start visit") { set(v.id, KometaTagTone.Now) },
                        KometaAction("Mark done") { set(v.id, KometaTagTone.Done) },
                        KometaAction("Send reminder", badge = "SMS") {},
                        KometaAction("Cancel visit", danger = true) { set(v.id, KometaTagTone.Error) },
                    ),
                    "Actions for ${v.name}", openId == v.id, { openId = if (it) v.id else null },
                )
            }
        }
    }
    // #endregion
}

@Composable
internal fun ActionsAlign() {
    // #region actions/align
    var open by remember { mutableStateOf(false) }
    val actions = listOf(KometaAction("Edit") {}, KometaAction("Export", badge = "PRO") {}, KometaAction("Cancel visit", danger = true) {})
    KometaActions(actions, "Visit actions", open, { open = it }, alignStart = true)
    // #endregion
}

// ---------------------------------------------------------------- confirm

@Composable
internal fun ConfirmBasic() {
    // #region confirm/basic
    var asking by remember { mutableStateOf(false) }
    var said by remember { mutableStateOf("") }
    KometaConfirm(asking, row = {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Body("Mark paid in cash")
            KometaWord("Mark", { asking = true })
        }
    }, question = {
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
            Body("Sure?")
            KometaWord("No", { asking = false }, quiet = true)
            KometaWord("Yes", { asking = false; said = "Confirm: yes" })
        }
    })
    Muted(said)
    // #endregion
}

private data class ActDebt(val id: Int, val name: String, val what: String, val paid: Boolean)

@Composable
internal fun ConfirmInContext() {
    // #region confirm/in-context
    var debts by remember {
        mutableStateOf(listOf(
            ActDebt(1, "Aziz Rahimov", "Haircut · 80 000 so'm", false),
            ActDebt(2, "Malika Yusupova", "Colour · 250 000 so'm", false),
            ActDebt(3, "Sardor Tursunov", "Beard trim · 40 000 so'm", true),
        ))
    }
    var asking by remember { mutableStateOf<Int?>(null) }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        debts.forEach { d ->
            KometaConfirm(asking == d.id, row = {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    KometaPerson(d.name, Modifier.weight(1f), meta = d.what, size = KometaPersonSize.Sm)
                    if (d.paid) KometaTag("Paid", tone = KometaTagTone.Done) else KometaWord("Mark paid", { asking = d.id })
                }
            }, question = {
                Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
                    Body("Paid in cash by ${d.name}?", Modifier.weight(1f))
                    Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        KometaWord("No", { asking = null }, quiet = true)
                        KometaWord("Yes, paid", { debts = debts.map { if (it.id == d.id) it.copy(paid = true) else it }; asking = null })
                    }
                }
            })
        }
    }
    // #endregion
}

// ---------------------------------------------------------------- pair

@Composable
internal fun PairBasic() {
    // #region pair/basic
    var busy by remember { mutableStateOf(false) }
    var said by remember { mutableStateOf("") }
    LaunchedEffect(busy) {
        if (busy) { delay(1200); busy = false; said = "Pair: confirmed" }
    }
    KometaPair("Keep", "Cancel visit", { said = "Pair: kept" }, { busy = true }, busy = busy)
    Muted(said)
    // #endregion
}

@Composable
internal fun PairInContext() {
    // #region pair/in-context
    var busy by remember { mutableStateOf(false) }
    var cancelled by remember { mutableStateOf(false) }
    LaunchedEffect(busy) {
        if (busy) { delay(1000); busy = false; cancelled = true }
    }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        KometaRows(label = "Your visit") {
            KometaRow(label = "Master") { KometaRowValue("Aziz Rahimov") }
            KometaRow(label = "When") { KometaRowValue("Friday, 11:00") }
            KometaRow(label = "ActService") { KometaRowValue("Haircut and beard") }
            KometaRow(label = "Price") { KometaRowValue("110 000 so'm") }
        }
        if (cancelled) {
            KometaBanner("The visit is cancelled and Aziz has been told.", actionLabel = "Book again", onAction = { cancelled = false })
        } else {
            KometaPair("Keep visit", "Cancel visit", {}, { busy = true }, busy = busy)
        }
    }
    // #endregion
}

@Composable
internal fun PairTone() {
    // #region pair/tone
    KometaPair("Back", "Save", {}, {}, primary = true)
    // #endregion
}

// ---------------------------------------------------------------- tray

@Composable
internal fun TrayBasic() {
    // #region tray/basic
    var ask by remember { mutableStateOf<KometaConfirmation?>(null) }
    var said by remember { mutableStateOf("") }
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        KometaButton("Ask (danger)", {
            ask = KometaConfirmation("Delete", "Keep it", header = "Delete service?", message = "It is gone for good.", danger = true)
        }, severity = KometaSeverity.Danger, variant = KometaButtonVariant.Outlined)
        KometaButton("Ask (plain)", {
            ask = KometaConfirmation("Leave", "Stay", header = "Leave without saving?")
        }, severity = KometaSeverity.Secondary)
    }
    Muted(said)
    // One tray per screen; it shows while the request is not null.
    KometaTray(ask, onAccept = { ask = null; said = "Tray: accepted" }, onReject = { ask = null; said = "Tray: rejected" })
    // #endregion
}

@Composable
internal fun TrayInContext() {
    // #region tray/in-context
    var blocked by remember { mutableStateOf(false) }
    var ask by remember { mutableStateOf<KometaConfirmation?>(null) }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        KometaPerson("Sardor Tursunov", meta = "+998 97 300 11 45 · 9 visits", size = KometaPersonSize.Lg)
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            KometaTag("3 no-shows", tone = KometaTagTone.Warn)
            if (blocked) KometaTag("Blocked", tone = KometaTagTone.Error)
        }
        if (blocked) {
            KometaButton("Unblock", { blocked = false }, severity = KometaSeverity.Secondary)
        } else {
            KometaButton("Block client", {
                ask = KometaConfirmation(
                    "Block", "Not now", header = "Block Sardor Tursunov?",
                    message = "He missed 3 visits. He cannot book online until you unblock him.", danger = true,
                )
            }, severity = KometaSeverity.Danger, variant = KometaButtonVariant.Outlined)
        }
    }
    KometaTray(ask, onAccept = { ask = null; blocked = true }, onReject = { ask = null })
    // #endregion
}

// ---------------------------------------------------------------- accordion

@Composable
internal fun AccordionBasic() {
    // #region accordion/basic
    var open by remember { mutableStateOf<Int?>(null) }
    val faq = listOf(
        "What is the lead fee?" to "12% of a new client's first visit.",
        "Is the link paid?" to "No, the booking link is free.",
    )
    Column {
        faq.forEachIndexed { i, (q, a) ->
            KometaAccordionItem(q, open == i, { open = if (it) i else null }) { Muted(a) }
        }
    }
    // #endregion
}

@Composable
internal fun AccordionInContext() {
    // #region accordion/in-context
    var open by remember { mutableStateOf<Int?>(null) }
    Column {
        KometaAccordionItem("Where are you?", open == 0, { open = if (it) 0 else null }) {
            Muted("Bunyodkor avenue 12, Chilonzor, next to the metro.")
            KometaLink("https://maps.app/kometa-chilonzor", copyLabel = "Copy map link", copiedLabel = "Copied", description = "Copy map link")
        }
        KometaAccordionItem("How do I pay?", open == 1, { open = if (it) 1 else null }) {
            Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                Muted("Cash, card, or")
                KometaProviderLogo("Click")
                Muted("Click and")
                KometaProviderLogo("Payme")
                Muted("Payme after the visit.")
            }
        }
        KometaAccordionItem("Can I cancel?", open == 2, { open = if (it) 2 else null }) {
            Muted("Free up to 2 hours before the visit.")
            KometaButton("Cancel my visit", {}, small = true, severity = KometaSeverity.Danger, variant = KometaButtonVariant.Outlined)
        }
    }
    // #endregion
}

@Composable
internal fun AccordionDisabled() {
    // #region accordion/disabled
    var open by remember { mutableStateOf(false) }
    Column {
        KometaAccordionItem("Locked question", false, {}, enabled = false) { Muted("Not reachable.") }
        KometaAccordionItem("Open question", open, { open = it }) { Muted("This one opens.") }
    }
    // #endregion
}

// ---------------------------------------------------------------- fold

@Composable
internal fun FoldFold() {
    // #region fold/fold
    var open by remember { mutableStateOf(false) }
    KometaFold("Opening hours", open, { open = it }, aside = { Muted("9–18") }) {
        Body("Mon–Fri 9:00–18:00, Sat 10:00–15:00.")
    }
    // #endregion
}

@Composable
internal fun FoldInContext() {
    // #region fold/in-context
    var order by remember { mutableStateOf(false) }
    var policy by remember { mutableStateOf(false) }
    Column {
        KometaFold("Order details", order, { order = it }, aside = { Body("135 000 so'm") }) {
            KometaRows {
                KometaRow(label = "Haircut") { KometaRowValue("80 000 so'm") }
                KometaRow(label = "Beard trim") { KometaRowValue("40 000 so'm") }
                KometaRow(label = "Hot towel") { KometaRowValue("15 000 so'm") }
            }
        }
        KometaFold("Cancellation policy", policy, { policy = it }) {
            Muted("Free up to 2 hours before the visit. Later than that, the master keeps 30%.")
        }
    }
    // #endregion
}

@Composable
internal fun FoldParts() {
    // #region fold/parts
    // KometaFoldMark on its own, for a trigger of your own.
    var open by remember { mutableStateOf(false) }
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
        KometaWord(if (open) "Hide" else "Toggle", { open = !open }, quiet = true, arrow = false)
        KometaFoldMark(open)
    }
    if (open) Body("Shown while the mark is open.")
    // #endregion
}

// ---------------------------------------------------------------- heading

@Composable
internal fun HeadingAction() {
    // #region heading/action
    KometaHeading("Today's visits") { KometaWord("See all", {}) }
    // #endregion
}

@Composable
internal fun HeadingInContext() {
    // #region heading/in-context
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        KometaHeading("Today's visits") { KometaWord("See all 12", {}) }
        listOf(
            Triple("10:00", "Dilnoza Karimova" to "Haircut", "Done" to KometaTagTone.Done),
            Triple("11:30", "Aziz Rahimov" to "Beard trim", "In the chair" to KometaTagTone.Now),
            Triple("13:00", "Malika Yusupova" to "Colour", "Booked" to KometaTagTone.Book),
        ).forEach { (time, who, tag) ->
            Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                BasicText(time, style = Kometa.type.md.copy(color = Kometa.colors.text))
                KometaPerson(who.first, Modifier.weight(1f), meta = who.second, size = KometaPersonSize.Sm)
                KometaTag(tag.first, tone = tag.second)
            }
        }
        KometaHeading("Tomorrow") { KometaWord("9 visits", {}, quiet = true) }
    }
    // #endregion
}

// ---------------------------------------------------------------- panes

@Composable
internal fun PanesBasic() {
    // #region panes/basic
    var size by remember { mutableIntStateOf(33) }
    KometaPanes(size, { size = it },
        start = {
            Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                BasicText("Clients", style = Kometa.type.md.copy(color = Kometa.colors.text))
                listOf("Anvar K.", "Malika R.", "Aziz T.").forEach { Muted(it) }
            }
        },
        end = {
            Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                BasicText("Anvar K.", style = Kometa.type.md.copy(color = Kometa.colors.text))
                Muted("12 visits · last on 2 Nov")
                Muted("Prefers a fade, no beard trim.")
            }
        },
    )
    // #endregion
}

private data class ActPaneClient(val name: String, val meta: String, val note: String)

@Composable
internal fun PanesInContext() {
    // #region panes/in-context
    val clients = listOf(
        ActPaneClient("Anvar Karimov", "12 visits · last 2 Nov", "Prefers a fade, no beard trim. Pays by card."),
        ActPaneClient("Malika Rashidova", "4 visits · last 28 Oct", "Colour every six weeks; allergic to ammonia."),
        ActPaneClient("Zafar Tursunov", "1 visit · last 30 Oct", "Came from Instagram. Hot towel shave."),
    )
    var size by remember { mutableIntStateOf(33) }
    var picked by remember { mutableStateOf(clients[0]) }
    KometaPanes(size, { size = it }, description = "Resize the client list",
        start = {
            Column(Modifier.padding(8.dp)) {
                clients.forEach { c -> KometaWord(c.name, { picked = c }, quiet = c != picked, arrow = false) }
            }
        },
        end = {
            Column(Modifier.padding(12.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                KometaPerson(picked.name, meta = picked.meta)
                Muted(picked.note)
            }
        },
    )
    // #endregion
}

@Composable
internal fun PanesFree() {
    // #region panes/panes-free
    var size by remember { mutableIntStateOf(50) }
    KometaPanes(size, { size = it }, snaps = emptyList(), min = 20, max = 80,
        start = { Body("Left", Modifier.padding(12.dp)) },
        end = { Body("Right", Modifier.padding(12.dp)) },
    )
    // #endregion
}

// ---------------------------------------------------------------- tabbar

private val tabs = listOf(KometaTab("a", "First"), KometaTab("b", "Second"))

@Composable
internal fun TabbarBasic() {
    // #region tabbar/basic
    var tab by remember { mutableStateOf("a") }
    KometaTabbar(tabs, tab, { tab = it }, icon = { BasicText("●", style = Kometa.type.small.copy(color = LocalKometaContentColor.current)) })
    Muted("Selected: $tab")
    // #endregion
}

@Composable
internal fun TabbarInContext() {
    // #region tabbar/in-context
    val phoneTabs = listOf(KometaTab("today", "Today"), KometaTab("clients", "Clients"), KometaTab("money", "Money"))
    val glyphs = mapOf("today" to "◷", "clients" to "☻", "money" to "∑")
    var tab by remember { mutableStateOf("today") }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Column(Modifier.height(180.dp), verticalArrangement = Arrangement.spacedBy(10.dp)) {
            when (tab) {
                "today" -> {
                    KometaHeading("Today")
                    KometaPerson("Dilnoza Karimova", meta = "10:00 · Haircut")
                    KometaPerson("Aziz Rahimov", meta = "11:30 · Beard trim")
                }
                "clients" -> {
                    KometaHeading("Clients")
                    KometaQuiet("248 clients", hint = "Search by name or phone.")
                }
                else -> {
                    KometaHeading("Money")
                    KometaSplit(KometaSplitSide("1 240 000", "Cash"), KometaSplitSide("860 000", "Card"))
                }
            }
        }
        KometaTabbar(phoneTabs, tab, { tab = it }, icon = { t ->
            BasicText(glyphs.getValue(t.value), style = Kometa.type.md.copy(color = LocalKometaContentColor.current))
        }, modifier = Modifier.align(Alignment.CenterHorizontally))
    }
    // #endregion
}

@Composable
internal fun TabbarLabels() {
    // #region tabbar/labels
    var tab by remember { mutableStateOf("a") }
    KometaTabbar(tabs, tab, { tab = it }, icon = { BasicText("●", style = Kometa.type.small.copy(color = LocalKometaContentColor.current)) }, allLabels = true)
    // #endregion
}

// ---------------------------------------------------------------- crumbs

@Composable
internal fun CrumbsBasic() {
    // #region crumbs/basic
    var said by remember { mutableStateOf("") }
    val crumbs = listOf("Shops", "Usta Barber", "Schedule")
    KometaCrumbs(crumbs, { said = "Crumb: ${crumbs[it]}" })
    Muted(said)
    // #endregion
}

private class ActSettingsNode(val label: String, val children: List<ActSettingsNode> = emptyList())

private val settingsTree = listOf(
    ActSettingsNode("Services", listOf(
        ActSettingsNode("Hair", listOf(ActSettingsNode("Haircut"), ActSettingsNode("Fade"), ActSettingsNode("Kids cut"))),
        ActSettingsNode("Beard", listOf(ActSettingsNode("Trim"), ActSettingsNode("Hot towel shave"))),
    )),
    ActSettingsNode("Team", listOf(ActSettingsNode("Masters"), ActSettingsNode("Roles"), ActSettingsNode("Schedule"))),
    ActSettingsNode("Shop page"),
)

@Composable
internal fun CrumbsInContext() {
    // #region crumbs/in-context
    var path by remember { mutableStateOf(listOf("Services")) }
    val here = path.fold(settingsTree) { nodes, label -> nodes.firstOrNull { it.label == label }?.children.orEmpty() }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        // Crumb 0 is "Settings", so crumb i keeps the first i labels of the path.
        KometaCrumbs(listOf("Settings") + path, { path = path.take(it) })
        if (here.isEmpty()) Muted("Nothing deeper. Pick a crumb to go back.")
        here.forEach { n -> KometaWord(n.label, { path = path + n.label }, quiet = true, arrow = n.children.isNotEmpty()) }
    }
    // #endregion
}

/** This file's regions by key; Docs.kt merges them into DOC_EXAMPLES. */
internal val ACTIONS_EXAMPLES = mapOf(
    "word/basic" to DocExample { WordBasic() },
    "word/in-context" to DocExample { WordInContext() },
    "word/arrow" to DocExample { WordArrow() },
    "erase/basic" to DocExample { EraseBasic() },
    "erase/in-context" to DocExample(260) { EraseInContext() },
    "halo/basic" to DocExample { HaloBasic() },
    "halo/in-context" to DocExample { HaloInContext() },
    "halo/halo-size" to DocExample { HaloSize() },
    "fab/basic" to DocExample { FabBasic() },
    "fab/in-context" to DocExample { FabInContext() },
    "actions/basic" to DocExample(220) { ActionsBasic() },
    "actions/in-context" to DocExample(220) { ActionsInContext() },
    "actions/align" to DocExample(200) { ActionsAlign() },
    "confirm/basic" to DocExample { ConfirmBasic() },
    "confirm/in-context" to DocExample { ConfirmInContext() },
    "pair/basic" to DocExample { PairBasic() },
    "pair/in-context" to DocExample { PairInContext() },
    "pair/tone" to DocExample { PairTone() },
    "tray/basic" to DocExample(260) { TrayBasic() },
    "tray/in-context" to DocExample(260) { TrayInContext() },
    "accordion/basic" to DocExample { AccordionBasic() },
    "accordion/in-context" to DocExample { AccordionInContext() },
    "accordion/disabled" to DocExample { AccordionDisabled() },
    "fold/fold" to DocExample { FoldFold() },
    "fold/in-context" to DocExample { FoldInContext() },
    "fold/parts" to DocExample { FoldParts() },
    "heading/action" to DocExample { HeadingAction() },
    "heading/in-context" to DocExample { HeadingInContext() },
    "panes/basic" to DocExample { PanesBasic() },
    "panes/in-context" to DocExample { PanesInContext() },
    "panes/panes-free" to DocExample { PanesFree() },
    "tabbar/basic" to DocExample { TabbarBasic() },
    "tabbar/in-context" to DocExample { TabbarInContext() },
    "tabbar/labels" to DocExample { TabbarLabels() },
    "crumbs/basic" to DocExample { CrumbsBasic() },
    "crumbs/in-context" to DocExample { CrumbsInContext() },
)
