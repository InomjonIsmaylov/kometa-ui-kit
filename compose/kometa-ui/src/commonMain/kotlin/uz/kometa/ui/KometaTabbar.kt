package uz.kometa.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.tween
import androidx.compose.animation.expandHorizontally
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkHorizontally
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.selection.selectableGroup
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp

data class KometaTab(val value: String, val label: String)

/**
 * A floating glass capsule of icon tabs (`k-tabbar`); the chosen one opens to show its word
 * ([allLabels] keeps every word open). [icon] draws a tab's icon in [LocalKometaContentColor].
 */
@Composable
fun KometaTabbar(
    tabs: List<KometaTab>,
    value: String,
    onValueChange: (String) -> Unit,
    icon: @Composable (KometaTab) -> Unit,
    modifier: Modifier = Modifier,
    allLabels: Boolean = false,
) {
    val c = Kometa.colors
    val pill = RoundedCornerShape(50)
    Row(
        modifier.clip(pill).background(c.bg).background(c.glass).border(1.dp, c.glassLine, pill).padding(6.dp).selectableGroup(),
        horizontalArrangement = Arrangement.spacedBy(2.dp),
    ) {
        tabs.forEach { tab ->
            val on = tab.value == value
            val ink by animateColorAsState(if (on) c.displayInk else c.muted, tween(420))
            Row(
                Modifier
                    .clip(pill)
                    .selectable(on, role = Role.Tab) { onValueChange(tab.value) }
                    .semantics { contentDescription = tab.label }
                    .padding(horizontal = 12.dp, vertical = 10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                CompositionLocalProvider(LocalKometaContentColor provides ink) { icon(tab) }
                AnimatedVisibility(
                    on || allLabels,
                    enter = expandHorizontally(tween(680, easing = SpringEase)) + fadeIn(tween(280)),
                    exit = shrinkHorizontally(tween(420)) + fadeOut(tween(200)),
                ) {
                    BasicText(
                        tab.label,
                        Modifier.padding(start = 8.dp).widthIn(max = 70.dp),
                        style = Kometa.type.body.copy(color = ink, fontWeight = FontWeight.SemiBold),
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                }
            }
        }
    }
}
