package uz.kometa.ui

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.heading
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.SpanStyle
import androidx.compose.ui.text.buildAnnotatedString
import androidx.compose.ui.text.withStyle
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

/**
 * Where you are, as a path that walks down the page (`k-crumbs`): each level a step further right and
 * a size larger, and the last one, the current page, a title behind a "↳". Every other level is
 * pressable and calls [onPick] with its index (the outermost is 0).
 */
@Composable
fun KometaCrumbs(items: List<String>, onPick: (Int) -> Unit, modifier: Modifier = Modifier) {
    val c = Kometa.colors
    Column(modifier) {
        items.forEachIndexed { i, label ->
            val indent = Modifier.padding(start = (i * 10).dp)
            if (i == items.lastIndex) {
                BasicText(
                    buildAnnotatedString {
                        withStyle(SpanStyle(color = c.muted)) { append("↳ ") }
                        append(label)
                    },
                    indent.semantics { heading() },
                    style = Kometa.type.title.copy(color = c.displayInk, fontSize = 18.sp),
                )
            } else {
                val near = i == items.lastIndex - 1
                BasicText(
                    label,
                    indent.clickable(role = Role.Button) { onPick(i) }.padding(vertical = 2.dp),
                    style = Kometa.type.title.copy(color = if (near) c.text2 else c.muted, fontSize = if (near) 14.sp else 12.sp),
                )
            }
        }
    }
}
