package uz.kometa.ui

import androidx.compose.animation.core.Animatable
import androidx.compose.animation.core.tween
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.defaultMinSize
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.text.BasicText
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.alpha
import androidx.compose.ui.draw.drawBehind
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.focus.onFocusChanged
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.lerp
import androidx.compose.ui.input.key.Key
import androidx.compose.ui.input.key.KeyEventType
import androidx.compose.ui.input.key.key
import androidx.compose.ui.input.key.onPreviewKeyEvent
import androidx.compose.ui.input.key.type
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.semantics.clearAndSetSemantics
import androidx.compose.ui.semantics.contentDescription
import androidx.compose.ui.semantics.semantics
import androidx.compose.ui.text.TextRange
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.TextFieldValue
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp

/** What a save stores: the trimmed entry, or null (keep [old]) when it is empty or unchanged. */
internal fun inplaceSave(old: String, typed: String): String? = typed.trim().takeIf { it.isNotEmpty() && it != old }

/**
 * A value you edit where it stands (`k-inplace`): a display-font word that turns into an input on
 * tap, its text selected. While you type, the old value sits above it struck through, so you can see
 * what you are replacing. Enter or leaving the field saves (an empty entry keeps the old value),
 * Escape cancels, and a save flashes the word. After Enter or Escape focus returns to the word.
 * [placeholder] shows, muted, while the value is empty; [label] names it, read as "label: value".
 */
@Composable
fun KometaInplace(
    value: String,
    onValueChange: (String) -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = "",
    label: String = "",
    enabled: Boolean = true,
) {
    val c = Kometa.colors
    var editing by remember { mutableStateOf(false) }
    var text by remember { mutableStateOf(TextFieldValue()) }
    var back by remember { mutableStateOf(false) }
    var saves by remember { mutableIntStateOf(0) }
    val flash = remember { Animatable(0f) }
    val box = remember { FocusRequester() }
    val word = remember { FocusRequester() }
    val style = Kometa.type.title.copy(color = c.displayInk, fontSize = 17.sp, fontWeight = FontWeight.Bold, letterSpacing = (-.02).em)

    LaunchedEffect(saves) { if (saves > 0) { flash.snapTo(1f); flash.animateTo(0f, tween(700)) } }
    LaunchedEffect(editing) {
        if (editing) box.requestFocus()
        else if (back) { back = false; word.requestFocus() }
    }
    fun close(save: Boolean, refocus: Boolean) {
        if (!editing) return // the focus loss that follows Enter or Escape
        val next = if (save) inplaceSave(value, text.text) else null
        if (next != null) { onValueChange(next); saves++ }
        back = refocus
        editing = false
    }

    if (editing) {
        var had by remember { mutableStateOf(false) }
        Column(modifier, verticalArrangement = Arrangement.spacedBy(2.dp)) {
            BasicText(
                value,
                Modifier.clearAndSetSemantics {},
                style = style.copy(color = c.muted, fontSize = 17.sp * .76f, textDecoration = TextDecoration.LineThrough),
            )
            BasicTextField(
                value = text,
                onValueChange = { text = it },
                modifier = Modifier
                    .widthIn(min = 80.dp)
                    .defaultMinSize(minHeight = 44.dp)
                    .focusRequester(box)
                    .onFocusChanged { if (it.isFocused) had = true else if (had) close(save = true, refocus = false) }
                    .onPreviewKeyEvent { e ->
                        if (e.type != KeyEventType.KeyDown) return@onPreviewKeyEvent false
                        when (e.key) {
                            Key.Enter, Key.NumPadEnter -> { close(save = true, refocus = true); true }
                            Key.Escape -> { close(save = false, refocus = true); true }
                            else -> false
                        }
                    }
                    .semantics { if (label.isNotEmpty()) contentDescription = label },
                singleLine = true,
                textStyle = style,
                cursorBrush = SolidColor(c.displayInk),
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                keyboardActions = KeyboardActions(onDone = { close(save = true, refocus = true) }),
                decorationBox = { inner ->
                    Box(Modifier.underline(c.displayInk, c.displayInk, 0f).padding(bottom = 3.dp), contentAlignment = Alignment.CenterStart) {
                        if (text.text.isEmpty()) BasicText(placeholder, style = style.copy(color = c.muted))
                        inner()
                    }
                },
            )
        }
    } else {
        val shown = value.ifEmpty { placeholder }
        Box(
            modifier
                .defaultMinSize(minHeight = 44.dp)
                .alpha(if (enabled) 1f else .5f)
                .drawBehind { if (flash.value > 0f) drawRect(c.displayInk.copy(alpha = flash.value)) }
                .focusRequester(word)
                .clickable(enabled = enabled, role = Role.Button) {
                    text = TextFieldValue(value, TextRange(0, value.length))
                    editing = true
                }
                .semantics { if (label.isNotEmpty()) contentDescription = "$label: $shown" },
            contentAlignment = Alignment.CenterStart,
        ) {
            BasicText(
                shown,
                if (label.isNotEmpty()) Modifier.clearAndSetSemantics {} else Modifier,
                style = style.copy(color = lerp(if (value.isEmpty()) c.muted else c.displayInk, c.bg, flash.value)),
            )
        }
    }
}
