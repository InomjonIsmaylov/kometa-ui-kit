package uz.kometa.ui

import androidx.compose.animation.core.animateDpAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.background
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsFocusedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.offset
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/** What is left of typed or pasted text as a code: its digits only, at most [length]. */
internal fun codeDigits(text: String, length: Int): String = text.filter { it in '0'..'9' }.take(length)

/**
 * One cell per digit (`k-code`), [length] 6 by default. A cream line sits under the cell being typed.
 * It is one text field drawn as cells, so typing, Backspace and pasting a whole code work as in any
 * field. [mask] hides the digits (a PIN); [placeholder] shows in each empty cell ("·"); [label] is a
 * muted line above the cells and their accessible name.
 */
@Composable
fun KometaCode(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    length: Int = 6,
    label: String = "",
    placeholder: String = "",
    mask: Boolean = false,
    enabled: Boolean = true,
) {
    val c = Kometa.colors
    val digits = codeDigits(value, length)
    val source = remember { MutableInteractionSource() }
    val focused by source.collectIsFocusedAsState()
    val cell = 32.dp
    val gap = 8.dp
    val at = digits.length.coerceAtMost(length - 1)
    val x by animateDpAsState((cell + gap) * at, tween(200, easing = SpringEase))
    val line by animateFloatAsState(if (focused) 1f else 0f, tween(200))
    val style = Kometa.type.title.copy(color = c.text, fontSize = 20.sp, textAlign = TextAlign.Center)

    Column(modifier.alpha(if (enabled) 1f else .5f)) {
        if (label.isNotEmpty()) BasicText(label, Modifier.padding(bottom = 8.dp), style = Kometa.type.body.copy(color = c.muted, fontSize = 13.sp))
        BasicTextField(
            value = digits,
            onValueChange = { onValueChange(codeDigits(it, length)) },
            modifier = Modifier.semantics { if (label.isNotEmpty()) contentDescription = label },
            enabled = enabled,
            singleLine = true,
            // shortcut: no one-time-code autofill hint (Compose 1.7 has no content type); the keyboard's own SMS suggestion still fills it.
            keyboardOptions = KeyboardOptions(keyboardType = if (mask) KeyboardType.NumberPassword else KeyboardType.Number),
            cursorBrush = SolidColor(Color.Transparent),
            interactionSource = source,
            decorationBox = { inner ->
                Box {
                    Row(horizontalArrangement = Arrangement.spacedBy(gap)) {
                        repeat(length) { i ->
                            val d = digits.getOrNull(i)
                            BasicText(
                                when { d == null -> placeholder; mask -> "•"; else -> d.toString() },
                                Modifier
                                    .width(cell)
                                    .drawBehind { drawLine(c.border, Offset(0f, size.height - .5.dp.toPx()), Offset(size.width, size.height - .5.dp.toPx()), 1.dp.toPx()) }
                                    .padding(vertical = 8.dp),
                                style = if (d == null) style.copy(color = c.muted.copy(alpha = .6f)) else style,
                            )
                        }
                    }
                    Box(Modifier.align(Alignment.BottomStart).offset(x = x).width(cell).height(2.dp).alpha(line).background(c.displayInk))
                    // The real field, invisible over the cells: it takes the keys, the cells draw them.
                    Box(Modifier.matchParentSize().alpha(0f)) { inner() }
                }
            },
        )
    }
}
