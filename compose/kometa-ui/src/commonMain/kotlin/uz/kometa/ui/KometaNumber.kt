package uz.kometa.ui

import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.IntrinsicSize
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.error
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

/** What is left of typed text as a whole number: the part before a `.` or `,`, digits only, at most [maxLength]. */
internal fun wholeDigits(text: String, maxLength: Int): String =
    text.split('.', ',').first().filter(Char::isDigit).take(maxLength)

/**
 * The one number field (`k-number`): a whole number typed into a bare figure over a hairline that
 * draws itself on focus. Typing never leaves [min]..[max] in [value]: it is held at the nearest end
 * while the box keeps what was typed (the line turns red), and the box catches up when focus leaves.
 * An empty box is `null`, never 0, so a price nobody typed is not saved as zero. [money] groups the
 * figure in threes, floors it at 0 unless [min] says otherwise and fills its row; [suffix] is a unit
 * word after it. For a small count with minus and plus circles use [KometaStepper].
 */
@Composable
fun KometaNumber(
    value: Long?,
    onValueChange: (Long?) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    min: Long? = null,
    max: Long? = null,
    suffix: String = "",
    placeholder: String = "",
    money: Boolean = false,
    enabled: Boolean = true,
    readOnly: Boolean = false,
) {
    val c = Kometa.colors
    val lo = min ?: if (money) 0L else Long.MIN_VALUE
    val hi = max ?: Long.MAX_VALUE
    val source = remember { MutableInteractionSource() }
    val focused by source.collectIsFocusedAsState()
    // What was typed, while the box has focus; null shows the model.
    var draft by remember { mutableStateOf<String?>(null) }
    // Focus edits the bare digits (no group spaces); leaving shows the model again.
    LaunchedEffect(focused) { draft = if (focused) value?.toString() ?: "" else null }
    val shown = draft ?: value?.let { if (money) groupThousands(it) else "$it" } ?: ""
    val bad = draft?.toLongOrNull()?.let { it < lo || it > hi } == true
    val draw by animateFloatAsState(if (focused || bad) 1f else .3f, tween(420, easing = SpringEase))
    val style = Kometa.type.title.copy(color = c.displayInk, fontSize = 24.sp, letterSpacing = (-.02).em)

    Row(
        modifier.then(if (money) Modifier.fillMaxWidth() else Modifier).alpha(if (enabled) 1f else .4f),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.Bottom,
    ) {
        BasicTextField(
            value = shown,
            onValueChange = { typed ->
                val digits = wholeDigits(typed, minOf(18, "$hi".length + 1))
                draft = digits
                onValueChange(digits.toLongOrNull()?.coerceIn(lo, hi))
            },
            modifier = Modifier
                .then(if (money) Modifier.weight(1f) else Modifier.width(IntrinsicSize.Min).defaultMinSize(minWidth = 48.dp))
                .underline(c.glassLine, if (bad) c.red else c.displayInk, draw)
                .semantics {
                    contentDescription = label
                    if (bad) error(if (draft!!.toLong() < lo) "≥ $lo" else "≤ $hi")
                },
            enabled = enabled,
            readOnly = readOnly,
            singleLine = true,
            textStyle = style,
            cursorBrush = SolidColor(c.displayInk),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
            interactionSource = source,
            decorationBox = { inner ->
                Box(Modifier.padding(bottom = 6.dp)) {
                    if (shown.isEmpty()) BasicText(placeholder, style = style.copy(color = c.muted), maxLines = 1)
                    inner()
                }
            },
        )
        if (suffix.isNotEmpty()) BasicText(suffix, Modifier.padding(bottom = 10.dp), style = Kometa.type.md.copy(color = c.muted))
    }
}
