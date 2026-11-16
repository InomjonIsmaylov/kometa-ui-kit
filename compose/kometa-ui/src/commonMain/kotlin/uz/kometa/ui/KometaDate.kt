package uz.kometa.ui

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.Immutable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

/** A calendar day with no time and no zone. [month] is 1–12. */
@Immutable
data class KometaDay(val year: Int, val month: Int, val day: Int) : Comparable<KometaDay> {
    override fun compareTo(other: KometaDay) = compareValuesBy(this, other, { it.year }, { it.month }, { it.day })
}

/** The words a date picker draws. [dayNamesMin] is Sunday first; the week is drawn from `weekStart`. */
@Immutable
data class KometaDateNames(
    val monthNames: List<String>,
    val monthNamesShort: List<String>,
    val dayNamesMin: List<String>,
    val prev: String,
    val next: String,
    val today: String = "today",
) {
    companion object {
        val English = KometaDateNames(
            listOf("January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"),
            listOf("Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"),
            listOf("Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"),
            "Previous month",
            "Next month",
        )
    }
}

internal fun isLeapYear(y: Int) = y % 4 == 0 && (y % 100 != 0 || y % 400 == 0)

internal fun daysInMonth(y: Int, m: Int) = when (m) {
    2 -> if (isLeapYear(y)) 29 else 28
    4, 6, 9, 11 -> 30
    else -> 31
}

/** 0 Sunday … 6 Saturday, as `Date.getDay()` counts (Sakamoto's method, Gregorian, year ≥ 1). */
internal fun weekday(y: Int, m: Int, d: Int): Int {
    val t = intArrayOf(0, 3, 2, 5, 0, 3, 5, 1, 4, 6, 2, 4)
    val yy = if (m < 3) y - 1 else y
    return (yy + yy / 4 - yy / 100 + yy / 400 + t[m - 1] + d) % 7
}

/** The 1st of the month [by] months from [d]'s month. */
internal fun monthShift(d: KometaDay, by: Int): KometaDay {
    val i = d.year * 12 + (d.month - 1) + by
    return KometaDay(i.floorDiv(12), i.mod(12) + 1, 1)
}

/** The month laid out in weeks from [weekStart] (1 Monday, 0 Sunday): blanks before the 1st are null, the last week is padded to 7. */
internal fun monthCells(y: Int, m: Int, weekStart: Int): List<Int?> {
    val lead = (weekday(y, m, 1) - weekStart + 7) % 7
    val days = List<Int?>(lead) { null } + (1..daysInMonth(y, m)).toList()
    return days + List((7 - days.size % 7) % 7) { null }
}

/** A tap on a period: the first tap (or one after a full period) starts it, the second ends it; an earlier second tap swaps them. */
internal fun pickRange(current: Pair<KometaDay, KometaDay?>?, tap: KometaDay): Pair<KometaDay, KometaDay?> = when {
    current == null || current.second != null -> tap to null
    tap < current.first -> tap to current.first
    else -> current.first to tap
}

internal fun dateLabel(d: KometaDay, names: KometaDateNames) = "${d.day} ${names.monthNamesShort[d.month - 1]} ${d.year}"

internal fun rangeLabel(r: Pair<KometaDay, KometaDay?>, names: KometaDateNames): String {
    val (a, b) = r
    return if (b != null && b != a) "${dateLabel(a, names)} – ${dateLabel(b, names)}" else dateLabel(a, names)
}

/**
 * One calendar day (`k-date`). The date is a figure with a hairline under it; a tap opens a glass month
 * in a popup (so no clipping parent cuts it) that flips above when there is no room below. Days are bare
 * figures: the chosen day takes the 2dp edge, [today] a small line. The week starts on Monday ([weekStart]
 * 0 for Sunday). Picking a day calls [onValueChange] and closes; a tap outside or Back closes too. [min]
 * and [max] grey out the days beyond and stop the month arrows there. [names] is the caller's language.
 * [inline] draws the month in place, with no figure and no popup, for a panel that already floats.
 * [description] is the accessible name. For a period use [KometaDateRange].
 */
@Composable
fun KometaDate(
    value: KometaDay?,
    onValueChange: (KometaDay) -> Unit,
    // shortcut: commonMain has no clock or time zone without kotlinx-datetime, so the caller passes today; upgrade if that dependency is added
    today: KometaDay,
    modifier: Modifier = Modifier,
    min: KometaDay? = null,
    max: KometaDay? = null,
    names: KometaDateNames = KometaDateNames.English,
    placeholder: String = "—",
    weekStart: Int = 1,
    inline: Boolean = false,
    enabled: Boolean = true,
    description: String = "",
) = DatePicker(
    shown = value?.let { dateLabel(it, names) }, focus = value ?: today, today = today, modifier = modifier,
    min = min, max = max, names = names, placeholder = placeholder, weekStart = weekStart, inline = inline,
    enabled = enabled, description = description, range = false,
    look = { if (it == value) DayLook.Chosen else DayLook.Plain },
    onPick = { onValueChange(it); true },
)

/**
 * A period (`k-date range`): the same figure and month as [KometaDate], but the first tap holds the start
 * ([value] is `start to null`) and the second the end (`start to end`, an earlier second tap swaps them)
 * and closes. The two ends are filled discs and a line joins them under the days between. The figure
 * reads "1 Nov 2026 – 9 Nov 2026".
 */
@Composable
fun KometaDateRange(
    value: Pair<KometaDay, KometaDay?>?,
    onValueChange: (Pair<KometaDay, KometaDay?>) -> Unit,
    today: KometaDay,
    modifier: Modifier = Modifier,
    min: KometaDay? = null,
    max: KometaDay? = null,
    names: KometaDateNames = KometaDateNames.English,
    placeholder: String = "—",
    weekStart: Int = 1,
    inline: Boolean = false,
    enabled: Boolean = true,
    description: String = "",
) = DatePicker(
    shown = value?.let { rangeLabel(it, names) }, focus = value?.let { if (inline) it.second ?: it.first else it.first } ?: today,
    today = today, modifier = modifier, min = min, max = max, names = names, placeholder = placeholder,
    weekStart = weekStart, inline = inline, enabled = enabled, description = description, range = true,
    look = { d ->
        val a = value?.first
        val b = value?.second
        when {
            d == a && (b == null || b == a) -> DayLook.Chosen
            d == a -> DayLook.From
            d == b -> DayLook.To
            a != null && b != null && d > a && d < b -> DayLook.Mid
            else -> DayLook.Plain
        }
    },
    onPick = { d -> pickRange(value, d).also(onValueChange).second != null },
)

private enum class DayLook { Plain, Chosen, From, To, Mid }

@Composable
private fun DatePicker(
    shown: String?,
    focus: KometaDay,
    today: KometaDay,
    modifier: Modifier,
    min: KometaDay?,
    max: KometaDay?,
    names: KometaDateNames,
    placeholder: String,
    weekStart: Int,
    inline: Boolean,
    enabled: Boolean,
    description: String,
    range: Boolean,
    look: (KometaDay) -> DayLook,
    /** Returns whether the pick closes the popup. */
    onPick: (KometaDay) -> Boolean,
) {
    var view by remember { mutableStateOf(monthShift(focus, 0)) }
    var open by remember { mutableStateOf(false) }
    if (inline) {
        Month(view, { view = it }, today, min, max, names, weekStart, range, description, look, { onPick(it) },
            modifier.widthIn(max = MonthWidth).fillMaxWidth())
        return
    }
    Box(modifier) {
        KometaFigureField(shown ?: placeholder, shown == null, open, enabled, description) {
            if (!open) view = monthShift(focus, 0)
            open = !open
        }
        KometaPop(open, { open = it }, label = description, width = MonthWidth) {
            Month(view, { view = it }, today, min, max, names, weekStart, range, "", look, { if (onPick(it)) open = false })
        }
    }
}

// 7 columns of 44dp plus the panel padding, so every day is a full touch target.
private val MonthWidth = 332.dp

@Composable
private fun Month(
    view: KometaDay,
    onView: (KometaDay) -> Unit,
    today: KometaDay,
    min: KometaDay?,
    max: KometaDay?,
    names: KometaDateNames,
    weekStart: Int,
    range: Boolean,
    description: String,
    look: (KometaDay) -> DayLook,
    onPick: (KometaDay) -> Unit,
    modifier: Modifier = Modifier,
) {
    val c = Kometa.colors
    val prev = monthShift(view, -1)
    val canPrev = min == null || prev.copy(day = daysInMonth(prev.year, prev.month)) >= min
    val canNext = max == null || monthShift(view, 1) <= max
    // shortcut: no arrow-key or PageUp/PageDown moves between days, Tab walks them; upgrade with FocusRequesters when keyboard use matters
    Column(modifier.padding(6.dp).semantics { if (description.isNotEmpty()) contentDescription = description }) {
        Row(Modifier.fillMaxWidth().padding(bottom = 6.dp), verticalAlignment = Alignment.CenterVertically) {
            MonthArrow("‹", names.prev, canPrev) { onView(prev) }
            BasicText(
                "${names.monthNames[view.month - 1]} ${view.year}",
                Modifier.weight(1f).semantics { liveRegion = LiveRegionMode.Polite },
                style = Kometa.type.md.copy(fontFamily = Kometa.fonts.display, fontSize = 15.sp, fontWeight = FontWeight.SemiBold, color = c.displayInk, textAlign = TextAlign.Center),
            )
            MonthArrow("›", names.next, canNext) { onView(monthShift(view, 1)) }
        }
        Row(Modifier.fillMaxWidth()) {
            repeat(7) { k ->
                BasicText(
                    names.dayNamesMin[(weekStart + k) % 7],
                    Modifier.weight(1f).padding(vertical = 4.dp).clearAndSetSemantics {},
                    style = Kometa.type.small.copy(color = c.muted, letterSpacing = .06.em, textAlign = TextAlign.Center),
                )
            }
        }
        monthCells(view.year, view.month, weekStart).chunked(7).forEach { week ->
            Row(Modifier.fillMaxWidth()) {
                week.forEach { n ->
                    if (n == null) Spacer(Modifier.weight(1f).height(44.dp))
                    else {
                        val d = view.copy(day = n)
                        val off = (min != null && d < min) || (max != null && d > max)
                        DayCell(d, look(d), d == today, off, range, names) { onPick(d) }
                    }
                }
            }
        }
    }
}

@Composable
private fun MonthArrow(glyph: String, label: String, enabled: Boolean, onClick: () -> Unit) {
    BasicText(
        glyph,
        Modifier
            .size(44.dp)
            .alpha(if (enabled) 1f else .3f)
            .clickable(enabled = enabled, role = Role.Button, onClick = onClick)
            .semantics { contentDescription = label }
            .padding(top = 8.dp),
        style = Kometa.type.md.copy(fontSize = 20.sp, color = Kometa.colors.displayInk, textAlign = TextAlign.Center),
    )
}

@Composable
private fun androidx.compose.foundation.layout.RowScope.DayCell(
    d: KometaDay, look: DayLook, isToday: Boolean, off: Boolean, range: Boolean, names: KometaDateNames, onClick: () -> Unit,
) {
    val c = Kometa.colors
    val ink = c.displayInk
    val chosen = look == DayLook.Chosen || look == DayLook.From || look == DayLook.To
    val disc = range && chosen
    Box(
        Modifier
            .weight(1f)
            .height(44.dp)
            .alpha(if (off) .3f else 1f)
            .drawBehind {
                val w = 1.dp.toPx()
                val y = size.height - w / 2
                when (look) {
                    DayLook.Mid -> drawLine(ink, Offset(0f, y), Offset(size.width, y), w)
                    DayLook.From -> drawLine(ink, Offset(size.width / 2, y), Offset(size.width, y), w)
                    DayLook.To -> drawLine(ink, Offset(0f, y), Offset(size.width / 2, y), w)
                    else -> {}
                }
                if (disc) drawCircle(ink, 15.dp.toPx())
                if (isToday) {
                    val ty = size.height - (if (range) 3 else 5).dp.toPx()
                    val half = 6.dp.toPx()
                    drawLine(if (disc) c.bg else ink, Offset(size.width / 2 - half, ty), Offset(size.width / 2 + half, ty), w)
                }
            }
            .then(if (chosen && !range) Modifier.border(2.dp, ink, RoundedCornerShape(10.dp)) else Modifier)
            .clickable(enabled = !off, role = Role.Button, onClick = onClick)
            .semantics {
                contentDescription = "${d.day} ${names.monthNames[d.month - 1]} ${d.year}"
                selected = chosen
                if (isToday) stateDescription = names.today
            },
        contentAlignment = Alignment.Center,
    ) {
        BasicText(
            d.day.toString(),
            style = Kometa.type.md.copy(
                color = when { disc -> c.bg; chosen || look == DayLook.Mid -> ink; else -> c.text },
                fontWeight = if (chosen) FontWeight.SemiBold else FontWeight.Medium,
                fontFeatureSettings = "tnum",
            ),
        )
    }
}

/**
 * The figure-with-a-hairline field shared by `k-date` and `k-time`: a 24sp display figure (muted when
 * [empty]) whose underline runs a third of the way and draws out to full while [open].
 */
@Composable
internal fun KometaFigureField(text: String, empty: Boolean, open: Boolean, enabled: Boolean, description: String, onClick: () -> Unit) {
    val c = Kometa.colors
    val reach by animateFloatAsState(if (open) 1f else .3f, tween(420, easing = SpringEase))
    BasicText(
        text,
        Modifier
            .defaultMinSize(minHeight = 44.dp)
            .alpha(if (enabled) 1f else .4f)
            .clickable(enabled = enabled, role = Role.DropdownList, onClick = onClick)
            .semantics {
                if (description.isNotEmpty()) contentDescription = description
                stateDescription = text
            }
            .drawBehind {
                val w = 1.dp.toPx()
                val y = size.height - w / 2
                val r = reach.coerceIn(0f, 1f)
                drawLine(c.displayInk.copy(alpha = .5f + .5f * (r - .3f) / .7f), Offset(0f, y), Offset(size.width * r, y), w)
            }
            .padding(bottom = 6.dp),
        style = Kometa.type.title.copy(
            fontSize = 24.sp, fontWeight = FontWeight.Normal, letterSpacing = (-.02).em, fontFeatureSettings = "tnum",
            color = if (empty) c.muted else c.displayInk,
        ),
    )
}
