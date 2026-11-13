package uz.kometa.ui

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
}
