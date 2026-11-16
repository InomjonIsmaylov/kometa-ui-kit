package uz.kometa.sample

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import uz.kometa.ui.*

// The data pages' Kotlin tabs (table, sort, pager, rows, reorder, swipe, tree, trail, share, split),
// cut out by `// #region page/id` like Docs.kt.

private data class Service(val id: Int, val name: String, val price: Int, val group: String)

private val services = listOf(
    Service(1, "Beard trim", 40000, "Beard"),
    Service(2, "Colour", 250000, "Hair"),
    Service(3, "Haircut", 80000, "Hair"),
)

@Composable
internal fun TableBasic() {
    // #region table/basic
    KometaTable(
        services, key = { it.id }, groupBy = { it.group },
        header = { KometaTableCell("Name", Modifier.weight(1f)); KometaTableCell("Price", Modifier.weight(1f)) },
        groupHeader = { KometaTableCell(it.group) },
        empty = { KometaTableCell("Nothing yet") },
    ) { s, _ ->
        KometaTableCell(s.name, Modifier.weight(1f))
        KometaTableCell(s.price.toString(), Modifier.weight(1f))
    }
    // #endregion
}

private data class TodayVisit(val id: Int, val time: String, val name: String, val service: String, val price: String, val status: KometaTagTone)

@Composable
internal fun TableInContext() {
    // #region table/in-context
    val words = mapOf(KometaTagTone.Done to "Done", KometaTagTone.Now to "In the chair", KometaTagTone.Book to "Booked", KometaTagTone.Wait to "Unconfirmed", KometaTagTone.Error to "Cancelled")
    var visits by remember {
        mutableStateOf(listOf(
            TodayVisit(1, "09:30", "Dilnoza Karimova", "Haircut", "80 000", KometaTagTone.Done),
            TodayVisit(2, "10:30", "Aziz Rahimov", "Beard trim", "40 000", KometaTagTone.Now),
            TodayVisit(3, "12:00", "Malika Yusupova", "Colour", "250 000", KometaTagTone.Book),
            TodayVisit(4, "15:30", "Sardor Tursunov", "Haircut and beard", "110 000", KometaTagTone.Wait),
        ))
    }
    var menuFor by remember { mutableStateOf<Int?>(null) }
    fun setStatus(id: Int, status: KometaTagTone) { visits = visits.map { if (it.id == id) it.copy(status = status) else it } }
    KometaTable(
        visits, key = { it.id }, hoverable = true, description = "Today's visits",
        header = {
            KometaTableCell("Time", Modifier.weight(1f)); KometaTableCell("Client", Modifier.weight(3f))
            KometaTableCell("Price", Modifier.weight(1.4f)); KometaTableCell("Status", Modifier.weight(2f)); Box(Modifier.weight(.8f))
        },
    ) { v, _ ->
        KometaTableCell(v.time, Modifier.weight(1f))
        KometaPerson(v.name, Modifier.weight(3f), meta = v.service, size = KometaPersonSize.Sm)
        KometaTableCell(v.price, Modifier.weight(1.4f))
        Box(Modifier.weight(2f)) { KometaTag(words.getValue(v.status), tone = v.status) }
        Box(Modifier.weight(.8f)) {
            KometaActions(
                listOf(
                    KometaAction("Mark done") { setStatus(v.id, KometaTagTone.Done) },
                    KometaAction("Call client") {},
                    KometaAction("Cancel visit", danger = true) { setStatus(v.id, KometaTagTone.Error) },
                ),
                label = "Actions for ${v.name}", open = menuFor == v.id, onOpenChange = { menuFor = if (it) v.id else null },
            )
        }
    }
    // #endregion
}

private data class LedgerRow(val id: Int, val master: String, val time: String, val service: String, val cash: Int, val card: Int)

@Composable
internal fun TableLedger() {
    // #region table/ledger
    val ledger = listOf(
        LedgerRow(1, "Aziz Rahimov", "09:30", "Haircut", 80000, 0),
        LedgerRow(2, "Aziz Rahimov", "11:00", "Haircut and beard", 0, 110000),
        LedgerRow(3, "Dilnoza Karimova", "10:00", "Colour", 0, 250000),
        LedgerRow(4, "Dilnoza Karimova", "13:30", "Haircut", 80000, 0),
        LedgerRow(5, "Dilnoza Karimova", "16:00", "Kids haircut", 60000, 0),
    )
    fun sum(n: Int) = if (n == 0) "—" else n.toString().reversed().chunked(3).joinToString(" ").reversed()
    KometaTable(
        ledger, key = { it.id }, groupBy = { it.master }, compact = true, striped = true, description = "Day ledger",
        header = {
            KometaTableCell("Time", Modifier.weight(1f)); KometaTableCell("Service", Modifier.weight(2f))
            KometaTableCell("Cash", Modifier.weight(1f)); KometaTableCell("Card", Modifier.weight(1f))
        },
        groupHeader = { r ->
            Row(Modifier.fillMaxWidth().padding(horizontal = 12.dp, vertical = 6.dp), verticalAlignment = Alignment.CenterVertically) {
                KometaPerson(r.master, Modifier.weight(1f), size = KometaPersonSize.Sm)
                BasicText("${sum(ledger.filter { it.master == r.master }.sumOf { it.cash + it.card })} so'm", style = Kometa.type.md)
            }
        },
    ) { r, _ ->
        KometaTableCell(r.time, Modifier.weight(1f)); KometaTableCell(r.service, Modifier.weight(2f))
        KometaTableCell(sum(r.cash), Modifier.weight(1f)); KometaTableCell(sum(r.card), Modifier.weight(1f))
    }
    // #endregion
}

@Composable
internal fun TableLook() {
    // #region table/look
    KometaTable(
        services, key = { it.id }, compact = true, striped = true, hoverable = true, description = "Price list",
        header = { KometaTableCell("Name", Modifier.weight(1f)); KometaTableCell("Price", Modifier.weight(1f)) },
    ) { s, _ ->
        KometaTableCell(s.name, Modifier.weight(1f))
        KometaTableCell(s.price.toString(), Modifier.weight(1f))
    }
    // #endregion
}

@Composable
internal fun SortBasic() {
    // #region sort/basic
    var key by remember { mutableStateOf("name") }
    var dir by remember { mutableStateOf(KometaSortDir.Asc) }
    KometaSort(
        listOf(KometaSortOption("name", "Name"), KometaSortOption("price", "Price")), key, dir,
        { dir = if (it == key && dir == KometaSortDir.Asc) KometaSortDir.Desc else KometaSortDir.Asc; key = it },
    )
    BasicText("Sorted by $key, $dir", style = Kometa.type.small.copy(color = Kometa.colors.muted))
    // #endregion
}

private data class Master(val name: String, val role: String, val rating: Float, val visits: Int)

@Composable
internal fun SortInContext() {
    // #region sort/in-context
    val board = listOf(
        Master("Aziz Rahimov", "Barber", 4.9f, 212),
        Master("Dilnoza Karimova", "Stylist", 4.7f, 168),
        Master("Jasur Nazarov", "Barber", 4.3f, 240),
        Master("Malika Yusupova", "Stylist", 4.8f, 131),
    )
    // The list view sorts; dirs starts rating and visits high to low, and picking a key again flips it.
    val view = rememberKometaListView(
        board,
        sorts = mapOf("rating" to compareBy<Master> { it.rating }, "visits" to compareBy { it.visits }, "name" to compareBy { it.name }),
        sort = "rating", pageSize = board.size,
        dirs = mapOf("rating" to KometaSortDir.Desc, "visits" to KometaSortDir.Desc),
    )
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        KometaSort(
            listOf(KometaSortOption("rating", "Rating"), KometaSortOption("visits", "Visits"), KometaSortOption("name", "Name")),
            view.sort, view.dir, view::pickSort, description = "Sort masters",
        )
        view.rows.forEachIndexed { i, m ->
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                BasicText("${i + 1}", style = Kometa.type.md.copy(color = Kometa.colors.muted))
                KometaPerson(m.name, Modifier.weight(1f), meta = "${m.role} · ${m.visits} visits")
                KometaStars(m.rating, "${m.rating} out of 5")
            }
        }
    }
    // #endregion
}

@Composable
internal fun SortHeader() {
    // #region sort/header
    var key by remember { mutableStateOf("name") }
    var dir by remember { mutableStateOf(KometaSortDir.Asc) }
    val pick = { k: String -> dir = if (k == key && dir == KometaSortDir.Asc) KometaSortDir.Desc else KometaSortDir.Asc; key = k }
    val rows = services.sortedWith(if (key == "name") compareBy { it.name } else compareBy { it.price })
        .let { if (dir == KometaSortDir.Desc) it.reversed() else it }
    KometaTable(
        rows, key = { it.id },
        header = {
            KometaSortHeader("name", key, dir, pick, Modifier.weight(1f)) { KometaTableCell("Name") }
            KometaSortHeader("price", key, dir, pick, Modifier.weight(1f)) { KometaTableCell("Price") }
        },
    ) { s, _ ->
        KometaTableCell(s.name, Modifier.weight(1f))
        KometaTableCell(s.price.toString(), Modifier.weight(1f))
    }
    // #endregion
}

@Composable
internal fun SortGlyphs() {
    // #region sort/glyphs
    var key by remember { mutableStateOf("name") }
    var dir by remember { mutableStateOf(KometaSortDir.Asc) }
    KometaSort(
        listOf(KometaSortOption("name", "Name"), KometaSortOption("price", "Price")), key, dir,
        { dir = if (it == key && dir == KometaSortDir.Asc) KometaSortDir.Desc else KometaSortDir.Asc; key = it },
        ascGlyph = "▲", descGlyph = "▼",
    )
    // #endregion
}

@Composable
internal fun PagerBasic() {
    // #region pager/basic
    var page by remember { mutableIntStateOf(1) }
    var pageSize by remember { mutableIntStateOf(10) }
    KometaPager(137, page, { page = it }, pageSize, { pageSize = it })
    BasicText("Page $page, $pageSize per page", style = Kometa.type.small.copy(color = Kometa.colors.muted))
    // #endregion
}

private data class Client(val id: Int, val name: String, val phone: String, val visits: Int)

@Composable
internal fun PagerInContext() {
    // #region pager/in-context
    val first = listOf("Dilnoza", "Aziz", "Malika", "Sardor", "Nodira", "Jasur")
    val last = listOf("Karimova", "Rahimov", "Yusupova", "Tursunov")
    val clients = List(47) { i -> Client(i + 1, "${first[i % 6]} ${last[i % 4]}", "+998 9${i % 10} ${100 + i * 37 % 900} ${10 + i * 7 % 90}", i * 7 % 23 + 1) }
    var page by remember { mutableIntStateOf(1) }
    var pageSize by remember { mutableIntStateOf(5) }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        KometaTable(
            clients.drop((page - 1) * pageSize).take(pageSize), key = { it.id }, compact = true, description = "Clients",
            header = { KometaTableCell("Client", Modifier.weight(2f)); KometaTableCell("Phone", Modifier.weight(2f)); KometaTableCell("Visits", Modifier.weight(1f)) },
        ) { c, _ ->
            KometaPerson(c.name, Modifier.weight(2f).padding(horizontal = 12.dp), size = KometaPersonSize.Sm)
            KometaTableCell(c.phone, Modifier.weight(2f)); KometaTableCell(c.visits.toString(), Modifier.weight(1f))
        }
        KometaPager(clients.size, page, { page = it }, pageSize, { pageSize = it }, sizes = listOf(5, 10, 25))
    }
    // #endregion
}

@Composable
internal fun PagerNoCaption() {
    // #region pager/no-caption
    var page by remember { mutableIntStateOf(1) }
    var pageSize by remember { mutableIntStateOf(10) }
    KometaPager(137, page, { page = it }, pageSize, { pageSize = it }, caption = false)
    // #endregion
}

@Composable
internal fun RowsBasic() {
    // #region rows/basic
    var taps by remember { mutableIntStateOf(0) }
    KometaRows(label = "Visit") {
        KometaRow(label = "Service") { KometaRowValue("Haircut") }
        KometaRow(label = "Time") { KometaRowValue("Mon · 14:00") }
        KometaRow(title = "Notifications", meta = "SMS and Telegram", tone = KometaRowTone.Amber, onClick = { taps++ }, icon = { BasicText("🔔") })
        KometaRow(title = "Disabled", meta = "Nothing here", tone = KometaRowTone.Blue, onClick = {}, enabled = false, icon = { BasicText("⛔") })
    }
    BasicText("Row activated $taps times.", style = Kometa.type.small.copy(color = Kometa.colors.muted))
    // #endregion
}

@Composable
internal fun RowsInContext() {
    // #region rows/in-context
    var last by remember { mutableStateOf("") }
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        KometaPerson("Malika Yusupova", meta = "Client since 2023 · 27 visits", size = KometaPersonSize.Lg)
        KometaRows(label = "Visit") {
            KometaRow(label = "Status") { KometaTag("Booked", tone = KometaTagTone.Book) }
            KometaRow(label = "When") { KometaRowValue("Friday, 11:00 – 12:30") }
            KometaRow(label = "Service") { KometaRowValue("Colour, long hair") }
            KometaRow(label = "Price") { KometaRowValue("250 000 so'm") }
        }
        KometaRows(label = "Actions") {
            KometaRow(title = "Call Malika", meta = "+998 93 410 77 02", tone = KometaRowTone.Green, onClick = { last = "Calling Malika" }, icon = { BasicText("☎") })
            KometaRow(title = "Send a reminder", meta = "Telegram, now", tone = KometaRowTone.Telegram, onClick = { last = "Reminder sent" }, icon = { BasicText("✈") })
            KometaRow(title = "Cancel visit", tone = KometaRowTone.Danger, onClick = { last = "Cancel asked" }, icon = { BasicText("✕") })
        }
        if (last.isNotEmpty()) BasicText(last, style = Kometa.type.small.copy(color = Kometa.colors.muted))
    }
    // #endregion
}

@Composable
internal fun ReorderBasic() {
    // #region reorder/basic
    var order by remember { mutableStateOf(listOf("Haircut", "Fade", "Beard trim", "Hot towel shave", "Kids cut")) }
    var moved by remember { mutableStateOf("") }
    KometaReorder(order, { order = it }, onMove = { from, to -> moved = "Moved from ${from + 1} to ${to + 1}" }, description = "Service order") { s, _ ->
        BasicText(s, style = Kometa.type.md.copy(color = Kometa.colors.text))
    }
    BasicText(moved, style = Kometa.type.small.copy(color = Kometa.colors.muted))
    // #endregion
}

private data class Walkin(val name: String, val meta: String)

@Composable
internal fun ReorderInContext() {
    // #region reorder/in-context
    var queue by remember {
        mutableStateOf(listOf(
            Walkin("Malika Rashidova", "Haircut · waiting 12 min"),
            Walkin("Aziz Tursunov", "Beard trim · waiting 8 min"),
            Walkin("Nodira Bakirova", "Fade · waiting 3 min"),
        ))
    }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        BasicText("Waiting · ${queue.size}", style = Kometa.type.md.copy(color = Kometa.colors.text, fontWeight = FontWeight.SemiBold))
        KometaReorder(queue, { queue = it }, labelOf = { it.name }, description = "Walk-in queue") { c, i ->
            KometaPerson(c.name, meta = (if (i == 0) "Next · " else "") + c.meta, size = KometaPersonSize.Sm)
        }
    }
    // #endregion
}

private data class SwipeVisit(val time: String, val name: String, val service: String, val done: Boolean = false)

@Composable
internal fun SwipeBasic() {
    // #region swipe/basic
    var visits by remember {
        mutableStateOf(listOf(
            SwipeVisit("10:00", "Anvar K.", "Haircut"),
            SwipeVisit("11:30", "Dilnoza S.", "Fade"),
            SwipeVisit("13:00", "Jasur M.", "Beard trim"),
            SwipeVisit("15:00", "Madina A.", "Kids cut"),
        ))
    }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        visits.forEach { v ->
            key(v.time) {
                KometaSwipe(
                    rightLabel = "Done", leftLabel = "Cancel visit",
                    onSwipeRight = { visits = visits.map { if (it.time == v.time) it.copy(done = !it.done) else it } },
                    onSwipeLeft = { visits = visits.filter { it.time != v.time } },
                ) {
                    val ink = if (v.done) Kometa.colors.muted else Kometa.colors.text
                    Row(Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        BasicText(v.time, style = Kometa.type.mono.copy(color = Kometa.colors.muted))
                        BasicText(v.name, style = Kometa.type.md.copy(color = ink, fontWeight = FontWeight.SemiBold))
                        BasicText(v.service, style = Kometa.type.md.copy(color = ink))
                    }
                }
            }
        }
    }
    // #endregion
}

@Composable
internal fun SwipeInContext() {
    // #region swipe/in-context
    var visits by remember {
        mutableStateOf(listOf(
            SwipeVisit("10:00", "Anvar K.", "Haircut"),
            SwipeVisit("11:30", "Dilnoza S.", "Fade"),
            SwipeVisit("13:00", "Jasur M.", "Beard trim"),
            SwipeVisit("15:00", "Madina A.", "Kids cut"),
        ))
    }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Row(Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            BasicText("Today", style = Kometa.type.md.copy(color = Kometa.colors.text, fontWeight = FontWeight.SemiBold))
            BasicText("${visits.count { it.done }} of ${visits.size} done", style = Kometa.type.small.copy(color = Kometa.colors.muted))
        }
        visits.forEach { v ->
            key(v.time) {
                KometaSwipe(
                    rightLabel = "Done", leftLabel = "Cancel visit",
                    onSwipeRight = { visits = visits.map { if (it.time == v.time) it.copy(done = !it.done) else it } },
                    onSwipeLeft = { visits = visits.filter { it.time != v.time } },
                ) {
                    Row(Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
                        BasicText(v.time, style = Kometa.type.mono.copy(color = Kometa.colors.muted))
                        BasicText(v.name, style = Kometa.type.md.copy(color = if (v.done) Kometa.colors.muted else Kometa.colors.text, fontWeight = FontWeight.SemiBold))
                        if (v.done) KometaTag("Done", tone = KometaTagTone.Done)
                    }
                }
            }
        }
    }
    // #endregion
}

@Composable
internal fun SwipeOne() {
    // #region swipe/swipe-one
    var paid by remember { mutableStateOf(false) }
    // No leftLabel, so only a swipe right moves the row.
    KometaSwipe(rightLabel = "Paid", ticks = 20, onSwipeRight = { paid = true }) {
        Row(Modifier.fillMaxWidth().padding(16.dp), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            BasicText("80 000", style = Kometa.type.mono.copy(color = Kometa.colors.muted))
            BasicText("Anvar K.", style = Kometa.type.md.copy(color = Kometa.colors.text, fontWeight = FontWeight.SemiBold))
            BasicText(if (paid) "Paid" else "Cash", style = Kometa.type.md.copy(color = Kometa.colors.text))
        }
    }
    // #endregion
}

@Composable
internal fun TreeBasic() {
    // #region tree/basic
    val menu = listOf(
        KometaTreeNode("Services", listOf(
            KometaTreeNode("Hair", listOf(KometaTreeNode("Haircut"), KometaTreeNode("Fade"), KometaTreeNode("Kids cut"))),
            KometaTreeNode("Beard", listOf(KometaTreeNode("Trim"), KometaTreeNode("Hot towel shave"))),
        )),
        KometaTreeNode("Team", listOf(KometaTreeNode("Masters"), KometaTreeNode("Roles"), KometaTreeNode("Schedule"))),
        KometaTreeNode("Shop page"),
    )
    var path by remember { mutableStateOf(listOf(0, 0)) }
    var picked by remember { mutableStateOf("") }
    KometaTree(menu, path, { path = it }, onPick = { picked = it.label }, description = "Settings")
    BasicText("Tree: $picked", style = Kometa.type.small.copy(color = Kometa.colors.muted))
    // #endregion
}

@Composable
internal fun TreeInContext() {
    // #region tree/in-context
    val menu = listOf(
        KometaTreeNode("Services", listOf(
            KometaTreeNode("Hair", listOf(KometaTreeNode("Haircut"), KometaTreeNode("Fade"), KometaTreeNode("Kids cut"))),
            KometaTreeNode("Beard", listOf(KometaTreeNode("Trim"), KometaTreeNode("Hot towel shave"))),
        )),
        KometaTreeNode("Team", listOf(KometaTreeNode("Masters"), KometaTreeNode("Roles"), KometaTreeNode("Schedule"))),
        KometaTreeNode("Shop page"),
    )
    var path by remember { mutableStateOf(emptyList<Int>()) }
    var service by remember { mutableStateOf<String?>(null) }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        KometaTree(menu, path, { path = it }, onPick = { service = it.label }, description = "Services")
        KometaButton(service?.let { "Book $it" } ?: "Pick a service", {}, Modifier.fillMaxWidth(), enabled = service != null)
    }
    // #endregion
}

@Composable
internal fun TrailBasic() {
    // #region trail/basic
    KometaTrail {
        KometaTrailStep("09:00", gap = "32 min") { BasicText("Booked online", style = Kometa.type.md.copy(color = Kometa.colors.text)) }
        KometaTrailStep("09:32", gap = "5 min") { BasicText("Confirmed by the master", style = Kometa.type.md.copy(color = Kometa.colors.text)) }
        KometaTrailStep("09:37") { BasicText("Reminder sent", style = Kometa.type.md.copy(color = Kometa.colors.text)) }
    }
    // #endregion
}

@Composable
internal fun TrailInContext() {
    // #region trail/in-context
    @Composable
    fun Step(text: String, tag: String? = null, tone: KometaTagTone = KometaTagTone.Book) =
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            BasicText(text, style = Kometa.type.md.copy(color = Kometa.colors.text))
            if (tag != null) KometaTag(tag, tone = tone)
        }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        KometaHeading("Visit #1042 · Aziz Rahimov")
        KometaTrail {
            KometaTrailStep("Mon 18:12", gap = "2 days") { Step("Booked online for Thursday, 11:00", "Booked") }
            KometaTrailStep("Wed 11:00", gap = "24 h") { Step("Reminder sent by Telegram") }
            KometaTrailStep("Thu 10:58", gap = "1 h 10 min") { Step("Arrived", "In the chair", KometaTagTone.Now) }
            KometaTrailStep("Thu 12:08") { Step("Paid 110 000 so'm with Click", "Done", KometaTagTone.Done) }
        }
    }
    // #endregion
}

@Composable
internal fun ShareBasic() {
    // #region share/basic
    val c = Kometa.colors
    KometaShare(
        listOf(
            KometaShareSegment("Haircut", 6_200_000.0, "6 200 000 so'm", c.amber),
            KometaShareSegment("Colour", 3_100_000.0, "3 100 000 so'm", c.green),
            KometaShareSegment("Beard", 900_000.0, "900 000 so'm", c.violet),
        ),
        label = "Revenue by service",
    )
    // #endregion
}

@Composable
internal fun ShareInContext() {
    // #region share/in-context
    val c = Kometa.colors
    var splitBy by remember { mutableStateOf("services") }
    val mix = when (splitBy) {
        "services" -> listOf(
            KometaShareSegment("Haircut", 14_200_000.0, "14 200 000 so'm", c.amber),
            KometaShareSegment("Colour", 9_600_000.0, "9 600 000 so'm", c.green),
            KometaShareSegment("Beard", 3_100_000.0, "3 100 000 so'm", c.violet),
            KometaShareSegment("Manicure", 2_400_000.0, "2 400 000 so'm", c.blue),
        )
        "masters" -> listOf(
            KometaShareSegment("Aziz Rahimov", 11_300_000.0, "11 300 000 so'm", c.amber),
            KometaShareSegment("Dilnoza Karimova", 10_100_000.0, "10 100 000 so'm", c.green),
            KometaShareSegment("Malika Yusupova", 7_900_000.0, "7 900 000 so'm", c.violet),
        )
        else -> listOf(
            KometaShareSegment("Cash", 15_800_000.0, "15 800 000 so'm", c.amber),
            KometaShareSegment("Click", 8_200_000.0, "8 200 000 so'm", c.green),
            KometaShareSegment("Payme", 5_300_000.0, "5 300 000 so'm", c.violet),
        )
    }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        KometaHeading("November takings") {
            KometaWords(
                listOf(KometaWordOption("services", "Services"), KometaWordOption("masters", "Masters"), KometaWordOption("pay", "Payment")),
                splitBy, { splitBy = it }, tabs = true, description = "Split by",
            )
        }
        KometaShare(mix, label = "November takings")
    }
    // #endregion
}

@Composable
internal fun ShareOptions() {
    // #region share/share-options
    val c = Kometa.colors
    val share = listOf(
        KometaShareSegment("Haircut", 6_200_000.0, "6 200 000 so'm", c.amber),
        KometaShareSegment("Colour", 3_100_000.0, "3 100 000 so'm", c.green),
        KometaShareSegment("Beard", 900_000.0, "900 000 so'm", c.violet),
    )
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        KometaShare(share, label = "No legend", legend = false, tickCount = 40)
        KometaShare(share, label = "No percents", percents = false, tickCount = 10)
    }
    // #endregion
}

@Composable
internal fun SplitBasic() {
    // #region split/basic
    KometaSplit(KometaSplitSide("8 400 000", "Cash"), KometaSplitSide("1 800 000", "Card"))
    // #endregion
}

@Composable
internal fun SplitInContext() {
    // #region split/in-context
    var closed by remember { mutableStateOf(false) }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        KometaHeading("Closing Tuesday")
        KometaSplit(KometaSplitSide("1 240 000", "Cash in the drawer"), KometaSplitSide("860 000", "Card and apps"))
        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            listOf("Click" to "520 000", "Payme" to "340 000").forEach { (app, sum) ->
                Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
                    KometaProviderLogo(app)
                    BasicText(sum, style = Kometa.type.md.copy(color = Kometa.colors.text))
                }
            }
        }
        KometaButton(if (closed) "Day closed ✓" else "Close the day", { closed = true }, Modifier.fillMaxWidth(), enabled = !closed)
    }
    // #endregion
}

@Composable
internal fun SplitAlign() {
    // #region split/align
    KometaSplit(KometaSplitSide("8 400 000", "Cash"), KometaSplitSide("1 800 000", "Card"), center = true)
    // #endregion
}

/** The regions above by key, merged into the site's Compose previews. */
internal val DATA_EXAMPLES = mapOf(
    "table/basic" to DocExample { TableBasic() },
    "table/in-context" to DocExample(160) { TableInContext() },
    "table/ledger" to DocExample { TableLedger() },
    "table/look" to DocExample { TableLook() },
    "sort/basic" to DocExample { SortBasic() },
    "sort/in-context" to DocExample { SortInContext() },
    "sort/header" to DocExample { SortHeader() },
    "sort/glyphs" to DocExample { SortGlyphs() },
    "pager/basic" to DocExample { PagerBasic() },
    "pager/in-context" to DocExample { PagerInContext() },
    "pager/no-caption" to DocExample { PagerNoCaption() },
    "rows/basic" to DocExample { RowsBasic() },
    "rows/in-context" to DocExample { RowsInContext() },
    "reorder/basic" to DocExample { ReorderBasic() },
    "reorder/in-context" to DocExample { ReorderInContext() },
    "swipe/basic" to DocExample { SwipeBasic() },
    "swipe/in-context" to DocExample { SwipeInContext() },
    "swipe/swipe-one" to DocExample { SwipeOne() },
    "tree/basic" to DocExample { TreeBasic() },
    "tree/in-context" to DocExample { TreeInContext() },
    "trail/basic" to DocExample { TrailBasic() },
    "trail/in-context" to DocExample { TrailInContext() },
    "share/basic" to DocExample { ShareBasic() },
    "share/in-context" to DocExample { ShareInContext() },
    "share/share-options" to DocExample { ShareOptions() },
    "split/basic" to DocExample { SplitBasic() },
    "split/in-context" to DocExample { SplitInContext() },
    "split/align" to DocExample { SplitAlign() },
)
