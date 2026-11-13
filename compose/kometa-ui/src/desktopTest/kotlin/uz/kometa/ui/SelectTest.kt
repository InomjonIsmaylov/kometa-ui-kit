package uz.kometa.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.padding
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.ImageComposeScene
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.input.pointer.PointerEventType
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import kotlin.test.Test
import kotlin.test.assertEquals

/** Opens the select with a tap and picks the third row from its popup list. */
class SelectTest {
    @OptIn(ExperimentalComposeUiApi::class)
    @Test fun tapOpensAndPicks() {
        var picked = ""
        val scene = ImageComposeScene(420, 500, Density(1.5f)) {
            KometaTheme(dark = true) {
                Column(Modifier.fillMaxSize().background(Kometa.colors.bg).padding(16.dp)) {
                    KometaSelect(listOf("Owner", "Barber", "Admin"), "Barber", { picked = it })
                }
            }
        }
        fun tap(x: Float, y: Float) {
            scene.sendPointerEvent(PointerEventType.Press, Offset(x, y))
            scene.sendPointerEvent(PointerEventType.Release, Offset(x, y))
        }
        var t = 0L
        fun settle() = repeat(20) { scene.render(++t * 100_000_000L) } // a popup animates only over many frames
        scene.render()
        tap(100f, 50f)
        settle()
        tap(90f, 270f) // the third row, below the field
        settle()
        scene.close()
        assertEquals("Admin", picked)
    }
}
