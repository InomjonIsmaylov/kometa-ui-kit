package uz.kometa.ui

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeOut
import androidx.compose.animation.shrinkVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxHeight
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import kotlinx.coroutines.delay
import androidx.compose.ui.semantics.LiveRegionMode
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.liveRegion
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em

enum class KometaBannerTone { Ok, Info, Warn, Error }

/**
 * A notice with no box (`k-banner`): a 2dp state-coloured hairline beside the sentence.
 * With [onDismiss] a close word ([closeLabel], × without one) collapses it, then calls back.
 * [actionLabel] adds one word beside the sentence ([onAction] fires). `warn`/`error` are
 * announced assertively, `ok`/`info` politely. The caller owns every word.
 */
@Composable
fun KometaBanner(
    text: String,
    modifier: Modifier = Modifier,
    tone: KometaBannerTone = KometaBannerTone.Info,
    actionLabel: String = "",
    onAction: () -> Unit = {},
    closeLabel: String = "",
    onDismiss: (() -> Unit)? = null,
    icon: (@Composable () -> Unit)? = null,
) {
    val c = Kometa.colors
    val line = when (tone) {
        KometaBannerTone.Ok -> c.green
        KometaBannerTone.Info -> c.blue
        KometaBannerTone.Warn -> c.red
        KometaBannerTone.Error -> c.error
    }
    var shown by remember { mutableStateOf(true) }
    val style = Kometa.type.md.copy(color = c.displayInk, lineHeight = 1.4.em)
    val word = style.copy(fontWeight = FontWeight.Bold, textDecoration = TextDecoration.Underline)

    // The callback waits for the collapse, so a caller that drops the banner from its list still sees it go.
    if (!shown && onDismiss != null) LaunchedEffect(Unit) { delay(420); onDismiss() }

    AnimatedVisibility(shown, exit = shrinkVertically() + fadeOut(), modifier = modifier) {
        Row(
            Modifier
                .height(IntrinsicSize.Min)
                .padding(bottom = 10.dp)
                .semantics {
                    liveRegion = if (tone == KometaBannerTone.Warn || tone == KometaBannerTone.Error) LiveRegionMode.Assertive else LiveRegionMode.Polite
                },
            horizontalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Box(Modifier.width(2.dp).fillMaxHeight().background(line))
            if (icon != null) CompositionLocalProvider(LocalKometaContentColor provides line) { icon() }
            BasicText(text, Modifier.weight(1f), style = style)
            if (actionLabel.isNotEmpty()) {
                BasicText(actionLabel, Modifier.clickable(role = Role.Button, onClick = onAction), style = word)
            }
            if (onDismiss != null) {
                BasicText(
                    closeLabel.ifEmpty { "×" },
                    Modifier
                        .clickable(onClickLabel = closeLabel.ifEmpty { "Dismiss" }, role = Role.Button) { shown = false }
                        .semantics { if (closeLabel.isEmpty()) contentDescription = "Dismiss" }
                        .padding(horizontal = 4.dp),
                    style = word.copy(textDecoration = null),
                )
            }
        }
    }
}
