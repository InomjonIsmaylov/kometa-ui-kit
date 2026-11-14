package uz.kometa.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.takeOrElse
import androidx.compose.ui.platform.LocalClipboardManager
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.unit.dp
import kotlinx.coroutines.delay

/**
 * A word that copies [text] (`k-link`) and reads [copiedLabel] for [copiedMs] ms, announced politely,
 * before going back to [copyLabel]. [description] names what is copied when the word alone is
 * ambiguous (one per table row). Ink is [LocalKometaContentColor], text colour when unset.
 */
@Composable
fun KometaLink(
    text: String,
    copyLabel: String,
    copiedLabel: String,
    modifier: Modifier = Modifier,
    description: String = "",
    copiedMs: Long = 900,
    enabled: Boolean = true,
) {
    // shortcut: no cream band swept over the copied value (the web kit strikes its previous sibling); Compose has no sibling to reach.
    val clipboard = LocalClipboardManager.current
    var copies by remember { mutableIntStateOf(0) }
    var copied by remember { mutableIntStateOf(0) }
    LaunchedEffect(copies) { if (copies > 0) { copied = copies; delay(copiedMs); copied = 0 } }
    val shown = if (copied > 0) copiedLabel else copyLabel
    Box(
        modifier
            .defaultMinSize(minHeight = 44.dp)
            .alpha(if (enabled) 1f else .5f)
            .clickable(remember { MutableInteractionSource() }, indication = null, enabled = enabled, role = Role.Button) {
                // A refused clipboard throws on some platforms; then the label just stays.
                runCatching { clipboard.setText(AnnotatedString(text)) }.onSuccess { copies++ }
            }
            .semantics { liveRegion = LiveRegionMode.Polite; if (description.isNotEmpty()) contentDescription = description },
        contentAlignment = Alignment.CenterStart,
    ) {
        BasicText(shown, style = Kometa.type.md.copy(color = LocalKometaContentColor.current.takeOrElse { Kometa.colors.text }))
    }
}
