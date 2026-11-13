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
}
