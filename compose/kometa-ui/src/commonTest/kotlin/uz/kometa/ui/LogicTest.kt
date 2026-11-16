package uz.kometa.ui

import androidx.compose.ui.unit.dp
import kotlin.test.Test
import kotlin.test.assertEquals

class LogicTest {
    @Test fun badgeCapsAtMax() {
        assertEquals("7", badgeText(7, 99))
        assertEquals("99", badgeText(99, 99))
        assertEquals("99+", badgeText(100, 99))
    }

    @Test fun stepperClamps() {
        assertEquals(1, stepValue(0, 1, 0, null))
        assertEquals(0, stepValue(0, -1, 0, null))
        assertEquals(5, stepValue(4, 2, 0, 5))
        assertEquals(1000, stepValue(999, 1, 0, null))
    }

    @Test fun initials() {
        assertEquals("AV", initialsOf("  ali   valiyev "))
        assertEquals("S", initialsOf("Sardor"))
        assertEquals("BK", initialsOf("Barber & Kids shop"))
        assertEquals("", initialsOf(""))
    }

    @Test fun meterScalesAbove40() {
        assertEquals(listOf(true, true, false), meterTicks(2f, 3))
        assertEquals(25, meterTicks(50f, 100).size)
        assertEquals(13, meterTicks(50f, 100).count { it })
        assertEquals(1, meterTicks(0f, 0).size)
    }

    @Test fun sliderSnapsAndClamps() {
        assertEquals(10, snapSlider(11.9f, 0, 20, 5))
        assertEquals(15, snapSlider(13f, 0, 20, 5))
        assertEquals(20, snapSlider(99f, 0, 20, 1))
        assertEquals(3, snapSlider(-4f, 3, 9, 2))
    }

    @Test fun starsRoundToHalves() {
        assertEquals(listOf(2, 2, 2, 2, 1), starFills(4.4f, 5))
        assertEquals(listOf(2, 2, 2, 2, 0), starFills(4.2f, 5))
        assertEquals(listOf(2, 2, 2), starFills(9f, 3))
        assertEquals(listOf(0, 0, 0), starFills(-1f, 3))
    }

    @Test fun nationalNumberGroups() {
        assertEquals("90 123 45 67", groupNational("901234567"))
        assertEquals("90 1", groupNational("901"))
        assertEquals("", groupNational(""))
    }

    @Test fun countdownFiguresAndTicks() {
        assertEquals("0:42", countdownFigure(42))
        assertEquals("1:02:05", countdownFigure(3725))
        assertEquals(10, countdownTicks(4, 10).size)
        assertEquals(4, countdownTicks(4, 10).count { it })
        assertEquals(30, countdownTicks(60, 120).size)
        assertEquals(15, countdownTicks(60, 120).count { it })
        assertEquals(0, countdownTicks(0, 60).count { it })
    }

    @Test fun tallyAndGrouping() {
        assertEquals("12 480", groupThousands(12480))
        assertEquals("-1 000 000", groupThousands(-1_000_000))
        assertEquals("999", groupThousands(999))
        assertEquals(15, tallyLit(30, 60, 30))
        assertEquals(30, tallyLit(99, 60, 30))
        assertEquals(0, tallyLit(5, 0, 30))
    }

    @Test fun numberKeepsWholeDigits() {
        assertEquals("12", wholeDigits("12.75", 10))
        assertEquals("1200", wholeDigits("1 200,5", 10))
        assertEquals("123", wholeDigits("12345", 3))
        assertEquals("", wholeDigits("abc", 3))
    }

    @Test fun dropListFlipsAndStaysInside() {
        val win = androidx.compose.ui.unit.IntSize(400, 800)
        val list = androidx.compose.ui.unit.IntSize(200, 300)
        val top = androidx.compose.ui.unit.IntRect(20, 100, 220, 140)
        assertEquals(androidx.compose.ui.unit.IntOffset(20, 146), placeBelowOrAbove(top, win, list, 6, 8))
        val low = androidx.compose.ui.unit.IntRect(300, 700, 390, 740)
        assertEquals(androidx.compose.ui.unit.IntOffset(192, 394), placeBelowOrAbove(low, win, list, 6, 8))
    }

    @Test fun batchHelpers() {
        assertEquals("1234", codeDigits("12-34", 6))
        assertEquals("123456", codeDigits("1234567", 6))
        assertEquals(null, notesStretch(31))
        assertEquals(30, notesStretch(30))
        assertEquals(10, notesStretch(6))
        assertEquals(0, notesStretch(-2))
        assertEquals(true, KometaRule("digit", Regex("[0-9]")).test("a1"))
        assertEquals(false, KometaRule("digit", Regex("[0-9]")).test("ab"))
        assertEquals(6, swipeLit(50f, 200f, 12))
        assertEquals(12, swipeLit(150f, 200f, 12))
        assertEquals(0, swipeLit(-20f, 200f, 12))
    }

    @Test fun batch6Helpers() {
        assertEquals(listOf("Ctrl", "Shift", "P"), keysOf(" Ctrl + Shift+P+ "))
        assertEquals(1f, keyGlow(400f, 0, 3))
        assertEquals(0f, keyGlow(1800f, 0, 3))
        assertEquals(0f, keyGlow(0f, 1, 3))
        assertEquals(40, revealSnap(41.9f))
        assertEquals(100, revealSnap(130f))
        assertEquals(0, revealSnap(-3f))
        assertEquals(150 to 141, splitWidths(100, 90, 307, 16))
        assertEquals(null, splitWidths(200, 190, 380, 16))
        val win = androidx.compose.ui.unit.IntSize(400, 800)
        val tip = androidx.compose.ui.unit.IntSize(200, 40)
        val mid = androidx.compose.ui.unit.IntRect(190, 300, 210, 320)
        assertEquals(androidx.compose.ui.unit.IntOffset(100, 252), placeNote(mid, win, tip, 8, 8, KometaNotePlacement.Auto))
        val top = androidx.compose.ui.unit.IntRect(380, 10, 400, 30)
        assertEquals(androidx.compose.ui.unit.IntOffset(192, 38), placeNote(top, win, tip, 8, 8, KometaNotePlacement.Auto))
    }

    @Test fun batch7Helpers() {
        val sz = { w: Int, h: Int -> androidx.compose.ui.unit.IntSize(w, h) }
        val rect = { l: Int, t: Int, r: Int, b: Int -> androidx.compose.ui.unit.IntRect(l, t, r, b) }
        val at = { x: Int, y: Int -> androidx.compose.ui.unit.IntOffset(x, y) }
        // actions, sort, paging
        assertEquals(2, nextEnabled(listOf(true, false, true), 0, 1))
        assertEquals(0, nextEnabled(listOf(true, false, true), 2, 1))
        assertEquals(2, nextEnabled(listOf(true, true, true), 3, -1))
        assertEquals(-1, nextEnabled(listOf(false, false), 0, 1))
        assertEquals(KometaSortDir.Desc, nextSortDir("n", "n", KometaSortDir.Asc))
        assertEquals(KometaSortDir.Asc, nextSortDir("name", "n", KometaSortDir.Desc))
        assertEquals(KometaSortDir.Desc, nextSortDir("n", "name", KometaSortDir.Asc, start = KometaSortDir.Desc))
        assertEquals(3, pageCountOf(25, 10))
        assertEquals(1, pageCountOf(0, 10))
        assertEquals(5, pageCountOf(5, 0))
        assertEquals(1, pageNow(2, "a", "b", 5))
        assertEquals(2, pageNow(3, "k", "k", 2))
        assertEquals((21..25).toList(), pageSlice((1..25).toList(), 3, 10))
        assertEquals(listOf("a1", "a2", "a10"), listOf("a10", "a2", "a1").sortedWith(::kometaSortText))
        assertEquals(0, kometaSortText("A", "a"))
        val view = KometaListView<Int>(mapOf("n" to compareBy { it }), "n", 10, mapOf("n" to KometaSortDir.Desc))
        view.source = (1..25).toList()
        assertEquals(KometaSortDir.Desc, view.dir)
        view.page = 3
        assertEquals(listOf(5, 4, 3, 2, 1), view.rows)
        view.pickSort("n")
        assertEquals(1, view.page)
        assertEquals((1..10).toList(), view.rows)
        // tip, pop, context
        assertEquals(at(150, 100), placeTip(rect(100, 100, 140, 140), sz(1000, 800), sz(100, 40), 10, 8, 8))
        assertEquals(at(790, 100), placeTip(rect(900, 100, 980, 140), sz(1000, 800), sz(100, 40), 10, 8, 8))
        assertEquals(at(75, 148), placeTip(rect(100, 100, 200, 140), sz(300, 800), sz(150, 40), 10, 8, 8))
        assertEquals(at(75, 702), placeTip(rect(100, 750, 200, 790), sz(300, 800), sz(150, 40), 10, 8, 8))
        assertEquals(at(100, 148), placePop(rect(100, 100, 200, 140), sz(1000, 800), sz(300, 200), 8, 8, false))
        assertEquals(at(8, 148), placePop(rect(100, 100, 200, 140), sz(1000, 800), sz(300, 200), 8, 8, true))
        assertEquals(at(100, 492), placePop(rect(100, 700, 200, 740), sz(1000, 800), sz(300, 200), 8, 8, false))
        assertEquals(at(100, 100), placeContext(at(100, 100), sz(1000, 800), sz(180, 200), 8))
        assertEquals(at(812, 500), placeContext(at(950, 700), sz(1000, 800), sz(180, 200), 8))
        // menu, fab, tray
        assertEquals("Alpha", menuShown(listOf(KometaWordOption("a", "Alpha")), "a", "Pick"))
        assertEquals("Pick", menuShown(listOf(KometaWordOption("a", "Alpha")), "x", "Pick"))
        assertEquals(0, fabRiseDelay(2, 3))
        assertEquals(80, fabRiseDelay(0, 3))
        assertEquals(true, trayIsSheet(639.dp))
        assertEquals(false, trayIsSheet(640.dp))
        // hue, pager, provider logo
        assertEquals("#E75555", hslToHex(0f, 75f, 62f))
        assertEquals("#00FF00", hslToHex(120f, 100f, 50f))
        assertEquals(240f, hexToHue("#0000FF"))
        assertEquals(0f, hexToHue("nope"))
        assertEquals(3, hueTick("#E7C255", 24))
        assertEquals(0, hueTick("#FF0008", 24))
        assertEquals(androidx.compose.ui.graphics.Color.Transparent, hexColor("bad"))
        assertEquals(listOf(1, 2, null, 9), pageWindow(1, 9))
        assertEquals(listOf(1, null, 4, 5, 6, null, 9), pageWindow(5, 9))
        assertEquals(listOf(1, 2, 3, 4, null, 9), pageWindow(3, 9))
        assertEquals("126–134 / 134", pagerCaption(134, 6, 25))
        assertEquals("click", providerMark(" Click "))
        assertEquals(null, providerMark("telegram"))
    }

    @Test fun batch8DateTime() {
        assertEquals(listOf(true, false, true), listOf(2024, 1900, 2000).map(::isLeapYear))
        assertEquals(listOf(29, 28, 30, 31), listOf(daysInMonth(2024, 2), daysInMonth(1900, 2), daysInMonth(2026, 4), daysInMonth(2026, 12)))
        assertEquals(listOf(0, 1, 6, 4), listOf(weekday(2026, 11, 1), weekday(2026, 11, 16), weekday(2000, 1, 1), weekday(2024, 2, 29)))
        assertEquals(List(6) { null } + (1..30) + List(6) { null }, monthCells(2026, 11, 1))
        assertEquals((1..30).toList() + List(5) { null }, monthCells(2026, 11, 0))
        assertEquals((1..28).toList(), monthCells(2026, 2, 0))
        assertEquals(KometaDay(2025, 12, 1), monthShift(KometaDay(2026, 1, 15), -1))
        assertEquals(KometaDay(2027, 1, 1), monthShift(KometaDay(2026, 12, 31), 1))
        val a = KometaDay(2026, 11, 1); val b = KometaDay(2026, 11, 9)
        assertEquals(a to null, pickRange(null, a))
        assertEquals(a to b, pickRange(a to null, b))
        assertEquals(a to b, pickRange(b to null, a))
        assertEquals(b to null, pickRange(a to b, b))
        assertEquals("16 Nov 2026", dateLabel(KometaDay(2026, 11, 16), KometaDateNames.English))
        assertEquals("1 Nov 2026 – 9 Nov 2026", rangeLabel(a to b, KometaDateNames.English))
        assertEquals("1 Nov 2026", rangeLabel(a to null, KometaDateNames.English))
        assertEquals(listOf("09:07", "00:00", "23:59"), listOf(547, 0, 1439).map(::timeLabel))
        assertEquals(96, timeSlots(15, null).size)
        assertEquals(listOf(540, 547, 555), timeSlots(15, 547).let { it.subList(it.indexOf(540), it.indexOf(540) + 3) })
        assertEquals(96, timeSlots(15, 540).size)
        assertEquals(1440, timeSlots(0, null).size)
        assertEquals(1439, timeSlots(60, 1439).last())
    }

    @Test fun batch8Inputs() {
        val cities = listOf("Tashkent", "Samarkand", "Bukhara")
        assertEquals(cities, matchOptions(cities, { it }, ""))
        assertEquals(listOf("Samarkand"), matchOptions(cities, { it }, "  SAM "))
        assertEquals(listOf<String>(), matchOptions(cities, { it }, "zz"))
        assertEquals(listOf(1, 2, 3), toggleChoice(listOf(1, 2), 3, null))
        assertEquals(listOf(1), toggleChoice(listOf(1, 2), 2, null))
        assertEquals(listOf(1, 2), toggleChoice(listOf(1, 2), 3, 2))
        assertEquals(listOf(2), toggleChoice(listOf(1, 2), 1, 2))
        assertEquals(listOf(1, 0, 2, 0, 2, -1), listOf(stepRow(0, 1, 3), stepRow(2, 1, 3), stepRow(0, -1, 3), stepRow(-1, 1, 3), stepRow(-1, -1, 3), stepRow(0, 1, 0)))
        assertEquals(listOf(false, true, false, true), listOf(suggestAsks("a", 2), suggestAsks("ab", 2), suggestAsks(" a ", 2), suggestAsks("  ", 0)))
        assertEquals("Vali", inplaceSave("Ali", "  Vali "))
        assertEquals(null, inplaceSave("Ali", " Ali "))
        assertEquals(null, inplaceSave("Ali", "   "))
    }

    @Test fun batch8Structure() {
        assertEquals(listOf(0, 2, 3), tableGroupStarts(listOf("a", "a", "b", "a")))
        assertEquals(listOf(0, 2), tableGroupStarts(listOf(null, null, 1)))
        val x = KometaTreeNode("X"); val a1 = KometaTreeNode("A1"); val a2 = KometaTreeNode("A2", listOf(x))
        val a = KometaTreeNode("A", listOf(a1, a2)); val b = KometaTreeNode("B"); val n = listOf(a, b)
        assertEquals(listOf(n), treeColumns(n, emptyList()))
        assertEquals(listOf(n, listOf(a1, a2), listOf(x)), treeColumns(n, listOf(0, 1)))
        assertEquals(listOf(n), treeColumns(n, listOf(1)))
        assertEquals(listOf(n), treeColumns(n, listOf(5)))
        assertEquals(2, treeColumns(n, listOf(0, 0, 3)).size)
        assertEquals(listOf(0, 0), treePick(listOf(0, 1, 0), 1, 0))
        assertEquals(listOf("b", "c", "a", "d"), reorderMove(listOf("a", "b", "c", "d"), 0, 2))
        assertEquals(listOf("d", "a", "b", "c"), reorderMove(listOf("a", "b", "c", "d"), 3, 0))
        val c = listOf(10f, 30f, 50f, 70f)
        assertEquals(listOf(2, 0, 1, 1), listOf(reorderTarget(c, 0, 45f), reorderTarget(c, 0, 0f), reorderTarget(c, 3, -45f), reorderTarget(c, 1, 0f)))
        assertEquals(listOf(-40f, 0f, 40f), listOf(reorderShift(1, 0, 2, 40f), reorderShift(3, 0, 2, 40f), reorderShift(1, 3, 0, 40f)))
        val s = listOf(25, 33, 50, 66, 75)
        assertEquals(listOf(25, 50, 75), panesStops(listOf(75, 10, 50, 90, 25), 15, 85))
        assertEquals(listOf(33, 50, 15, 48, 85), listOf(panesFit(40f, s, 15, 85), panesFit(58f, s, 15, 85), panesFit(3f, emptyList(), 15, 85), panesFit(47.6f, emptyList(), 15, 85), panesFit(99f, emptyList(), 15, 85)))
        assertEquals(listOf(66, 75, 33, 25, 55, 85), listOf(panesStep(50, true, s, 15, 85), panesStep(75, true, s, 15, 85), panesStep(50, false, s, 15, 85), panesStep(25, false, s, 15, 85), panesStep(50, true, emptyList(), 15, 85), panesStep(83, true, emptyList(), 15, 85)))
    }

    @Test fun batch8Media() {
        assertEquals(listOf(0, 0, 0, 1), shareTicks(listOf(3.0, 1.0), 4))
        assertEquals(listOf(-1, -1, -1), shareTicks(listOf(0.0, 0.0), 3))
        assertEquals(List(48) { 0 } + 1, shareTicks(listOf(100.0, 1.0, -5.0), 48))
        assertEquals(listOf("25%", "67%", "1%", "", ""), listOf(sharePercent(1.0, listOf(1.0, 3.0)), sharePercent(2.0, listOf(1.0, 2.0)), sharePercent(1.0, listOf(1.0, 199.0)), sharePercent(-5.0, listOf(-5.0, 2.0)), sharePercent(0.0, listOf(0.0))))
        assertEquals(listOf(.42f, 1f, 0f, 0f, 1f), listOf(uploadShown(.42f, KometaUploadState.Running), uploadShown(1.5f, KometaUploadState.Running), uploadShown(-1f, KometaUploadState.Idle), uploadShown(Float.NaN, KometaUploadState.Failed), uploadShown(0f, KometaUploadState.Done)))
        assertEquals(listOf(0, 2, 1, 0), listOf(carouselClamp(-1, 3), carouselClamp(5, 3), carouselClamp(1, 3), carouselClamp(0, 0)))
        assertEquals(listOf(-1, 0, 1, 0, 0, 0), listOf(carouselSide(10f, 300f, 1, 3), carouselSide(10f, 300f, 0, 3), carouselSide(250f, 300f, 1, 3), carouselSide(250f, 300f, 2, 3), carouselSide(150f, 300f, 1, 3), carouselSide(10f, 0f, 1, 3)))
        assertEquals(listOf(4, 0, 3, 0), listOf(photosWrap(0, -1, 5), photosWrap(4, 1, 5), photosWrap(2, 1, 5), photosWrap(0, 1, 0)))
        assertEquals(listOf(1.25f, 3f, .5f), listOf(photosZoom(1f, .25f), photosZoom(3f, .25f), photosZoom(.5f, -.25f)))
        assertEquals(listOf(true, false, true, false), listOf(90, 180, -270, 0).map(::photosSideways))
        assertEquals(listOf(1, -1, 0, 0), listOf(-60f, 60f, 50f, -10f).map(::photosSwipe))
    }
}
