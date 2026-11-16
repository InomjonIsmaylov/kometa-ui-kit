package uz.kometa.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.hoverable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.heightIn
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.verticalScroll
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.remember
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.DrawScope
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.graphics.takeOrElse
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp

/** The indices of [keys] where a new group starts: the first row and every row whose key differs from the one before. */
internal fun tableGroupStarts(keys: List<Any?>): List<Int> = keys.indices.filter { it == 0 || keys[it] != keys[it - 1] }

private class TableCellStyle(val head: Boolean, val padX: Dp, val padY: Dp)
private val LocalTableCell = staticCompositionLocalOf { TableCellStyle(false, 16.dp, 12.dp) }

/**
 * A plain table for the lists the consoles show (`k-table`), generic over [rows]. [header] and [row]
 * are a [RowScope] each, so their cells line up by sharing `Modifier.weight` / `width`; use
 * [KometaTableCell] for text cells. Every row sits on a hairline; the header's words are muted and
 * semibold, the figures tabular. [groupBy] draws [groupHeader] before the first row of each run of
 * equal keys; [key] keeps a row's state with its item when the list changes (the web `dataKey`).
 * [empty] shows when there are no rows. [compact] tightens the padding (`size="sm"`), [striped] tints
 * every second row, [hoverable] the row under the pointer. A finite [maxHeight] caps the height and
 * scrolls the rows under a header that stays put. Sorting and paging stay the caller's
 * ([KometaSortHeader], [KometaPager]).
 */
// A Column, not a LazyColumn: console lists arrive a page (25 rows) at a time from KometaPager, and a
// lazy list would fight a parent verticalScroll. shortcut: every row is composed, switch to LazyColumn for unpaged lists of hundreds.
@Composable
fun <T> KometaTable(
    rows: List<T>,
    modifier: Modifier = Modifier,
    key: ((T) -> Any)? = null,
    groupBy: ((T) -> Any?)? = null,
    compact: Boolean = false,
    striped: Boolean = false,
    hoverable: Boolean = false,
    maxHeight: Dp = Dp.Infinity,
    description: String = "",
    header: (@Composable RowScope.() -> Unit)? = null,
    groupHeader: @Composable (T) -> Unit = {},
    empty: @Composable () -> Unit = {},
    row: @Composable RowScope.(item: T, index: Int) -> Unit,
) {
    val c = Kometa.colors
    val padX = if (compact) 12.dp else 16.dp
    val padY = if (compact) 6.dp else 12.dp
    val starts = remember(rows, groupBy) { if (groupBy == null) emptySet() else tableGroupStarts(rows.map(groupBy)).toSet() }
    val hairline: DrawScope.() -> Unit = { drawLine(c.glassLine, Offset(0f, size.height - .5f), Offset(size.width, size.height - .5f), 1.dp.toPx()) }

    // shortcut: no sideways scroll for tables wider than the screen (the web overflow-x), wrap it in horizontalScroll with fixed cell widths if needed.
    Column(modifier.fillMaxWidth().semantics { if (description.isNotEmpty()) contentDescription = description }) {
        if (header != null) {
            CompositionLocalProvider(LocalTableCell provides TableCellStyle(true, padX, padY)) {
                Row(Modifier.fillMaxWidth().drawBehind(hairline), verticalAlignment = Alignment.CenterVertically, content = header)
            }
        }
        Column(
            Modifier
                .fillMaxWidth()
                .heightIn(max = maxHeight)
                .then(if (maxHeight != Dp.Infinity) Modifier.verticalScroll(rememberScrollState()) else Modifier),
        ) {
            if (rows.isEmpty()) empty()
            CompositionLocalProvider(LocalTableCell provides TableCellStyle(false, padX, padY)) {
                rows.forEachIndexed { i, item ->
                    key(key?.invoke(item) ?: i) {
                        if (i in starts) groupHeader(item)
                        val source = remember { MutableInteractionSource() }
                        val hovered by source.collectIsHoveredAsState()
                        val tint = when {
                            hoverable && hovered -> c.text.copy(alpha = .07f)
                            striped && i % 2 == 1 -> c.text.copy(alpha = .04f)
                            else -> Color.Transparent
                        }
                        Row(
                            Modifier
                                .fillMaxWidth()
                                .then(if (hoverable) Modifier.hoverable(source) else Modifier)
                                .background(tint)
                                .drawBehind(hairline),
                            verticalAlignment = Alignment.CenterVertically,
                        ) { row(item, i) }
                    }
                }
            }
        }
    }
}

/**
 * One text cell of a [KometaTable] row or header, padded like the web `td` / `th`: muted semibold in
 * the header, [LocalKometaContentColor] (else text) in a row. Give it a `Modifier.weight` so the
 * columns line up.
 */
@Composable
fun KometaTableCell(text: String, modifier: Modifier = Modifier, align: TextAlign = TextAlign.Start) {
    val s = LocalTableCell.current
    val c = Kometa.colors
    BasicText(
        text,
        modifier.padding(horizontal = s.padX, vertical = s.padY),
        style = Kometa.type.md.copy(
            color = if (s.head) c.muted else LocalKometaContentColor.current.takeOrElse { c.text },
            fontWeight = if (s.head) FontWeight.SemiBold else Kometa.type.md.fontWeight,
            fontFeatureSettings = "tnum",
            textAlign = align,
        ),
    )
}
