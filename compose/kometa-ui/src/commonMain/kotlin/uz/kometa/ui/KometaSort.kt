package uz.kometa.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.RowScope
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.dp

/** The direction a list is sorted in. */
enum class KometaSortDir { Asc, Desc }

/** One word for [KometaSort]: [value] is the sort key, [label] the word shown. */
data class KometaSortOption(val value: String, val label: String)

/** The direction a tap on [option] asks for: the other one on the active key, else [start] for a new key. */
internal fun nextSortDir(option: String, key: String, dir: KometaSortDir, start: KometaSortDir = KometaSortDir.Asc): KometaSortDir =
    if (option != key) start else if (dir == KometaSortDir.Asc) KometaSortDir.Desc else KometaSortDir.Asc

/**
 * Sort words for a list of cards (`k-sort`). The options are words; the active one is [Kometa.colors]
 * text with a 2dp cream line under it, followed by [ascGlyph] or [descGlyph]. It holds no state: a tap
 * only reports the key to [onPick] (feed it to [KometaListView.pickSort], which flips the direction on
 * the active key and switches on another). The words wrap onto a second line when the row is full.
 * Nothing is animated. A screen reader hears the active word as selected with [ascLabel] / [descLabel];
 * [description] names the group (the web default is "Sort", in the caller's language here).
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun KometaSort(
    options: List<KometaSortOption>,
    key: String,
    dir: KometaSortDir,
    onPick: (String) -> Unit,
    modifier: Modifier = Modifier,
    description: String = "Sort",
    ascLabel: String = "ascending",
    descLabel: String = "descending",
    ascGlyph: String = "↑",
    descGlyph: String = "↓",
) {
    val c = Kometa.colors
    FlowRow(
        modifier.semantics { if (description.isNotEmpty()) contentDescription = description },
        horizontalArrangement = Arrangement.spacedBy(16.dp),
        verticalArrangement = Arrangement.Center,
    ) {
        options.forEach { o ->
            val on = o.value == key
            val source = remember { MutableInteractionSource() }
            val hovered by source.collectIsHoveredAsState()
            val pressed by source.collectIsPressedAsState()
            Row(
                Modifier
                    .defaultMinSize(minHeight = 44.dp)
                    .clickable(source, indication = null, role = Role.Button) { onPick(o.value) }
                    .semantics {
                        selected = on
                        if (on) stateDescription = if (dir == KometaSortDir.Desc) descLabel else ascLabel
                    }
                    .textRule(if (on) c.displayInk else Color.Transparent, width = 2.dp)
                    .padding(vertical = 8.dp),
                horizontalArrangement = Arrangement.spacedBy(4.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                BasicText(o.label, style = Kometa.type.md.copy(color = if (on || hovered || pressed) c.text else c.muted), maxLines = 1)
                if (on) SortGlyph(if (dir == KometaSortDir.Desc) descGlyph else ascGlyph)
            }
        }
    }
}

@Composable
private fun RowScope.SortGlyph(glyph: String) =
    BasicText(glyph, Modifier.clearAndSetSemantics { }, style = Kometa.type.small.copy(color = Kometa.colors.text))

/**
 * A sortable table column's header (`th[kometaSortHeader]`): [content] (the column's name) as a
 * button that reports [key] to [onPick], followed by [ascGlyph] / [descGlyph] while [active] is this
 * column. It inherits the header's text style, so put it inside the cell's own text styling. A
 * screen reader hears the column's direction ([ascLabel] / [descLabel]) on the active column only.
 */
@Composable
fun KometaSortHeader(
    key: String,
    active: String,
    dir: KometaSortDir,
    onPick: (String) -> Unit,
    modifier: Modifier = Modifier,
    ascLabel: String = "ascending",
    descLabel: String = "descending",
    ascGlyph: String = "↑",
    descGlyph: String = "↓",
    content: @Composable () -> Unit,
) {
    val on = active == key
    // shortcut: no hover colour change (the web turns the name --text); add a hover source if headers are muted.
    Row(
        modifier
            .defaultMinSize(minHeight = 44.dp)
            .clickable(remember { MutableInteractionSource() }, indication = null, role = Role.Button) { onPick(key) }
            .semantics { if (on) stateDescription = if (dir == KometaSortDir.Desc) descLabel else ascLabel },
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        content()
        if (on) SortGlyph(if (dir == KometaSortDir.Desc) descGlyph else ascGlyph)
    }
}
