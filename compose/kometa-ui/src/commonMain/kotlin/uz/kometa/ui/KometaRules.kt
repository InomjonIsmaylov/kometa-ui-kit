package uz.kometa.ui

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.ExperimentalLayoutApi
import androidx.compose.foundation.layout.FlowRow
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.drawWithContent
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.semantics.stateDescription
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** One rule for [KometaRules]: met when [test] returns true for the value. */
class KometaRule(val label: String, val test: (String) -> Boolean) {
    /** Met when [pattern] is found anywhere in the value, as the web kit's string rules are. */
    constructor(label: String, pattern: Regex) : this(label, { pattern.containsMatchIn(it) })
}

/**
 * What a value still needs (`k-rules`): a row of words that strike through as each rule is met, with
 * the 1dp line [KometaCheck] draws through a done label. Put it under the field (a password, say)
 * and pass that field's [value]. A met rule is read with [doneLabel]; [description] names the list.
 */
@OptIn(ExperimentalLayoutApi::class)
@Composable
fun KometaRules(
    value: String,
    rules: List<KometaRule>,
    modifier: Modifier = Modifier,
    doneLabel: String = "done",
    description: String = "",
) {
    val c = Kometa.colors
    FlowRow(
        modifier.semantics { if (description.isNotEmpty()) contentDescription = description },
        horizontalArrangement = Arrangement.spacedBy(12.dp),
        verticalArrangement = Arrangement.spacedBy(2.dp),
    ) {
        rules.forEach { rule ->
            val ok = rule.test(value)
            val ink by animateColorAsState(if (ok) c.muted else c.text2, tween(300))
            val strike by animateFloatAsState(if (ok) 1f else 0f, tween(350, easing = SpringEase))
            BasicText(
                rule.label,
                Modifier
                    .semantics { if (ok) stateDescription = doneLabel }
                    .drawWithContent {
                        drawContent()
                        // The line grows from the left at 55% of the line's height, like the web's ::after.
                        if (strike > 0f) drawLine(c.muted, Offset(0f, size.height * .55f), Offset(size.width * strike, size.height * .55f), 1.dp.toPx())
                    },
                style = Kometa.type.body.copy(color = ink, fontSize = 12.sp),
            )
        }
    }
}
