package uz.kometa.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp

/**
 * The footer of a confirm that destroys something (`k-pair`): an equal pair, a quiet [keep] beside a
 * red [confirm]. [primary] draws the confirm side amber, for a pair that destroys nothing. [busy]
 * spins the confirm side and locks both, so a double tap cannot confirm twice; [confirmEnabled] locks
 * only the confirm side.
 */
@Composable
fun KometaPair(
    keep: String,
    confirm: String,
    onKeep: () -> Unit,
    onConfirm: () -> Unit,
    modifier: Modifier = Modifier,
    busy: Boolean = false,
    enabled: Boolean = true,
    confirmEnabled: Boolean = true,
    primary: Boolean = false,
) {
    val c = Kometa.colors
    val shape = RoundedCornerShape(50)

    @Composable
    fun Side(label: String, live: Boolean, filled: Boolean, spin: Boolean, onClick: () -> Unit, m: Modifier) {
        val fill = if (!filled) Color.Transparent else if (primary) c.amber else c.red
        val ink = if (!filled) c.displayInk else if (primary) c.onAmber else Color.White
        Box(
            m.height(48.dp)
                .alpha(if (live || spin) 1f else .45f)
                .clip(shape)
                .background(fill, shape)
                .border(1.dp, if (filled) Color.Transparent else c.glassLine, shape)
                .clickable(enabled = live, role = Role.Button, onClick = onClick)
                .padding(horizontal = 20.dp),
            contentAlignment = Alignment.Center,
        ) {
            if (spin) KometaSpinner(ink)
            else BasicText(label, style = Kometa.type.md.copy(color = ink, fontWeight = if (filled) FontWeight.SemiBold else FontWeight.Medium), maxLines = 1)
        }
    }

    Row(modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(10.dp)) {
        Side(keep, enabled && !busy, filled = false, spin = false, onClick = onKeep, m = Modifier.weight(1f))
        Side(confirm, enabled && !busy && confirmEnabled, filled = true, spin = busy, onClick = onConfirm, m = Modifier.weight(1f))
    }
}
