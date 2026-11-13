package uz.kometa.ui

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.AnnotatedString
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.OffsetMapping
import androidx.compose.ui.text.input.TransformedText
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

/** Where the spaces go in a 9-digit national number: `90 123 45 67`. */
private val CUTS = intArrayOf(2, 5, 7)

/** "901234567" → "90 123 45 67". Shorter input keeps the same cuts. */
internal fun groupNational(digits: String): String = buildString {
    digits.forEachIndexed { i, ch ->
        if (i in CUTS) append(' ')
        append(ch)
    }
}

private object NationalGrouping : VisualTransformation {
    override fun filter(text: AnnotatedString): TransformedText {
        val raw = text.text
        return TransformedText(AnnotatedString(groupNational(raw)), object : OffsetMapping {
            override fun originalToTransformed(offset: Int) = offset + CUTS.count { it < offset }
            override fun transformedToOriginal(offset: Int) =
                (offset - CUTS.withIndex().count { (n, cut) -> cut + n < offset }).coerceIn(0, raw.length)
        })
    }
}

/**
 * A national phone number (`k-digits`) after a display-only [prefix]. [value] is digits only, at
 * most 9, and is shown grouped as `90 123 45 67`. [small] sits in a 44dp form row; the default is
 * the big figure. [label] is the accessible name.
 */
@Composable
fun KometaDigits(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    prefix: String = "+998",
    placeholder: String = "",
    small: Boolean = false,
    enabled: Boolean = true,
) {
    val c = Kometa.colors
    val style = Kometa.type.title.copy(
        color = c.displayInk,
        fontSize = if (small) 16.sp else 32.sp,
        fontWeight = if (small) FontWeight.Medium else FontWeight.SemiBold,
        letterSpacing = if (small) 0.em else (-.03).em,
    )
    Row(
        modifier.alpha(if (enabled) 1f else .5f),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        verticalAlignment = Alignment.CenterVertically,
    ) {
        BasicText(prefix, style = style)
        BasicTextField(
            value = value,
            onValueChange = { onValueChange(it.filter(Char::isDigit).take(9)) },
            // 12 characters: nine digits and three spaces.
            modifier = Modifier.width(with(androidx.compose.ui.platform.LocalDensity.current) { (style.fontSize * 7.4f).toDp() })
                .semantics { contentDescription = label },
            enabled = enabled,
            singleLine = true,
            textStyle = style,
            cursorBrush = SolidColor(c.displayInk),
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
            visualTransformation = NationalGrouping,
            decorationBox = { inner ->
                Box {
                    if (value.isEmpty() && placeholder.isNotEmpty()) BasicText(placeholder, style = style.copy(color = c.muted))
                    inner()
                }
            },
        )
    }
}
