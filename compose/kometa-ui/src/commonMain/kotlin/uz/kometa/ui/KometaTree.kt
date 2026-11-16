package uz.kometa.ui

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.clickable
import androidx.compose.foundation.horizontalScroll
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsHoveredAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.key
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalDensity
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.selected
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** One word of a [KometaTree]; a node with [children] is a branch, one without a leaf. */
data class KometaTreeNode(val label: String, val children: List<KometaTreeNode> = emptyList(), val value: Any? = null)

/** The columns a [path] opens: the root, then the children of each chosen branch, stopping at a leaf or a bad index. */
internal fun treeColumns(nodes: List<KometaTreeNode>, path: List<Int>): List<List<KometaTreeNode>> {
    val cols = mutableListOf(nodes)
    for (i in path) {
        val kids = cols.last().getOrNull(i)?.children
        if (kids.isNullOrEmpty()) break
        cols += kids
    }
    return cols
}

/** The path after picking word [i] in column [d]: the choices before that column, then [i]. */
internal fun treePick(path: List<Int>, d: Int, i: Int): List<Int> = path.take(d) + i

/**
 * A tree drawn as columns (`k-tree`): pick a word and its children slide in as the next column, each
 * behind a hairline. The chosen word in every column goes cream; a branch carries a "›". [path] holds
 * the chosen index per column, outermost first; a pick reports the new path to [onPathChange] and the
 * node to [onPick]. The columns scroll sideways when they run out of room. A screen reader hears the
 * chosen word as selected and a branch as [expandedLabel] / [collapsedLabel].
 */
@Composable
fun KometaTree(
    nodes: List<KometaTreeNode>,
    path: List<Int>,
    onPathChange: (List<Int>) -> Unit,
    modifier: Modifier = Modifier,
    onPick: (KometaTreeNode) -> Unit = {},
    description: String = "",
    expandedLabel: String = "expanded",
    collapsedLabel: String = "collapsed",
) {
    val c = Kometa.colors
    val dx = with(LocalDensity.current) { (-10).dp.toPx() }
    val columns = treeColumns(nodes, path)
    // shortcut: no arrow-key moves between words and columns (the web keydown), add onKeyEvent if a desktop app needs them.
    Row(
        modifier
            .height(IntrinsicSize.Min)
            .horizontalScroll(rememberScrollState())
            .semantics { if (description.isNotEmpty()) contentDescription = description },
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        columns.forEachIndexed { d, col ->
            key(d, col) {
                val enter = remember { Animatable(0f) }
                LaunchedEffect(Unit) { enter.animateTo(1f, tween(400, easing = SpringEase)) }
                Column(
                    Modifier
                        .width(IntrinsicSize.Max)
                        .fillMaxHeight()
                        .defaultMinSize(minWidth = 120.dp)
                        .graphicsLayer { alpha = enter.value.coerceIn(0f, 1f); translationX = dx * (1f - enter.value) }
                        .then(
                            if (d == 0) Modifier
                            else Modifier.drawBehind { drawLine(c.glassLine, Offset(.5f, 0f), Offset(.5f, size.height), 1.dp.toPx()) }.padding(start = 10.dp),
                        ),
                ) {
                    col.forEachIndexed { i, n ->
                        val on = path.getOrNull(d) == i
                        val branch = n.children.isNotEmpty()
                        val source = remember { MutableInteractionSource() }
                        val hovered by source.collectIsHoveredAsState()
                        Row(
                            Modifier
                                .fillMaxWidth()
                                .defaultMinSize(minHeight = 44.dp)
                                .clickable(source, indication = null, role = Role.Button) {
                                    onPathChange(treePick(path, d, i))
                                    onPick(n)
                                }
                                .semantics {
                                    selected = on
                                    if (branch) stateDescription = if (on) expandedLabel else collapsedLabel
                                },
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            verticalAlignment = Alignment.CenterVertically,
                        ) {
                            val style = Kometa.type.title.copy(fontSize = 13.sp, color = if (on || hovered) c.displayInk else c.muted)
                            BasicText(n.label, Modifier.weight(1f).padding(vertical = 3.dp), style = style)
                            if (branch) BasicText("›", style = style.copy(color = c.muted))
                        }
                    }
                }
            }
        }
    }
}
