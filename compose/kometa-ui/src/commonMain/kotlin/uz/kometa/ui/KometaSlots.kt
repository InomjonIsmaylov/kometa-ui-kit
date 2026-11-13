package uz.kometa.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** One free time for [KometaSlots]; [note] is a muted second line ("2 left"). */
data class KometaSlot(val value: String, val label: String, val note: String = "", val disabled: Boolean = false)

/**
 * Free times as glass chips (`k-slots`); the chosen one gets an amber edge, never an amber fill.
 * [value] is the chosen slot's `value`, "" for none. With [clearable] a second tap on the chosen
 * chip clears it, for a grid that holds a time before it commits. [enabled] = false disables all.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun KometaSlots(
    slots: List<KometaSlot>,
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    clearable: Boolean = false,
    enabled: Boolean = true,
    description: String = "",
) {
    val c = Kometa.colors
    val shape = RoundedCornerShape(14.dp)
    FlowRow(
        modifier.selectableGroup().semantics { if (description.isNotEmpty()) contentDescription = description },
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        slots.forEach { slot ->
            val on = slot.value == value
            val live = enabled && !slot.disabled
            val source = remember { MutableInteractionSource() }
            val pressed by source.collectIsPressedAsState()
            val edge by animateDpAsState(if (on) 2.dp else 0.dp, tween(200))
            val line by animateColorAsState(if (pressed) c.displayInk else c.glassLine, tween(200))
            Column(
                Modifier
                    .defaultMinSize(minWidth = 72.dp, minHeight = 44.dp)
                    .alpha(if (live) 1f else .5f)
                    .clip(shape)
                    .background(c.glass)
                    .drawWithContent {
                        drawContent()
                        // CSS `inset 2px 0 0 amber, inset 0 1px 0 white/.1`; the clip bends the edge round the corners.
                        if (edge > 0.dp) {
                            drawRect(c.amber, size = Size(edge.toPx(), size.height))
                            drawLine(Color.White.copy(alpha = .1f), Offset(0f, .5f), Offset(size.width, .5f), 1.dp.toPx())
                        }
                    }
                    .border(1.dp, line, shape)
                    .selectable(on, source, indication = null, enabled = live, role = Role.RadioButton) {
                        onValueChange(if (clearable && on) "" else slot.value)
                    }
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                verticalArrangement = Arrangement.spacedBy(2.dp),
            ) {
                BasicText(slot.label, style = Kometa.type.md.copy(color = c.text, fontSize = 15.sp))
                if (slot.note.isNotEmpty()) BasicText(slot.note, style = Kometa.type.small.copy(color = c.muted))
            }
        }
    }
}
