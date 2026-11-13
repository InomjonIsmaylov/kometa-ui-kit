package uz.kometa.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.ImageComposeScene
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.Density
import androidx.compose.ui.unit.dp
import org.jetbrains.skia.EncodedImageFormat
import java.io.File
import kotlin.test.Test

/** Renders every component in both schemes to build/gallery*-{dark,light}.png, to eyeball against the web kit. */
class GalleryRender {
    private fun shoot(name: String, height: Int, page: @Composable ColumnScope.() -> Unit) {
        for (dark in listOf(true, false)) {
            val scene = ImageComposeScene(420, height, Density(1.5f)) {
                KometaTheme(dark = dark) {
                    Column(
                        Modifier.fillMaxSize().background(Kometa.colors.bg).padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(14.dp),
                        content = page,
                    )
                }
            }
            scene.render() // first frame starts the animations; the later ones let them settle
            scene.render(1_000_000_000L)
            scene.render(2_000_000_000L) // a popup composes a frame late, so its animation starts a frame late
            val png = scene.render(4_000_000_000L).encodeToData(EncodedImageFormat.PNG)!!.bytes
            File("build/$name-${if (dark) "dark" else "light"}.png").writeBytes(png)
            scene.close()
        }
    }

    @Test fun controls() = shoot("gallery", 1120) {
        BasicText("KOMETA UI", style = Kometa.type.eyebrow.copy(color = Kometa.colors.muted))
        BasicText("Bookings", style = Kometa.type.title.copy(color = Kometa.colors.text))
        KometaButton("Book now", {}, Modifier.fillMaxWidth())
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            KometaButton("Later", {}, severity = KometaSeverity.Secondary, small = true)
            KometaButton("Cancel", {}, severity = KometaSeverity.Danger, variant = KometaButtonVariant.Outlined, small = true)
            KometaButton("Saving", {}, small = true, loading = true, severity = KometaSeverity.Secondary)
            KometaButton("Skip", {}, variant = KometaButtonVariant.Text, small = true)
        }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            KometaTag("Now", tone = KometaTagTone.Now)
            KometaTag("Waiting", tone = KometaTagTone.Wait)
            KometaTag("Done", tone = KometaTagTone.Done)
            KometaTag("Cancelled", tone = KometaTagTone.Warn)
        }
        KometaBanner("No internet connection.", tone = KometaBannerTone.Warn, actionLabel = "Retry", onDismiss = {})
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            KometaChip("Haircut", selected = true, onSelectedChange = {}, count = "12")
            KometaChip("Beard", selected = false, onSelectedChange = {})
            KometaBadge(3) { KometaChip("Inbox", selected = false, onSelectedChange = {}) }
        }
        KometaCheck("Bring the receipt", checked = true, onCheckedChange = {})
        KometaCheck("Call the shop", checked = false, onCheckedChange = {})
        Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
            KometaToggle(true, {}, onLabel = "Open", offLabel = "Closed")
            KometaToggle(false, {}, onLabel = "Open", offLabel = "Closed")
            KometaToggle(true, {})
            KometaToggle(false, {})
        }
        KometaField("", {}, label = "Your name", showCount = true, maxLength = 40)
        KometaField("abc", {}, label = "Phone", small = true, error = "Enter a full number")
        KometaStepper(2, {}, unit = "hours", max = 8)
    }

    @Test fun display() = shoot("gallery2", 1320) {
        KometaHeading("Today") { KometaButton("All", {}, variant = KometaButtonVariant.Text, small = true) }
        KometaPerson("Ali Valiyev", meta = "Haircut · 14:30") { KometaTag("Now", tone = KometaTagTone.Now) }
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
            KometaPerson("Barber Shop", square = true, bare = true)
            KometaPerson("Sardor", size = KometaPersonSize.Lg, bare = true)
            KometaStars(4.5f, "4.5 of 5", size = 20.dp)
        }
        KometaMeter(17, 25, unit = "visits left")
        KometaSlider(12, {}, max = 20, unit = "km")
        KometaRating(4, {}, words = listOf("Bad", "Poor", "Fine", "Good", "Great"))
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp), verticalAlignment = Alignment.CenterVertically) {
            KometaTick(true, {}, "Paid")
            KometaTick(false, {}, "Paid")
            KometaWait("Loading slots")
        }
        KometaSteps(listOf("Service", "Time", "Confirm"), current = 2)
        KometaFold("Opening hours", open = true, onOpenChange = {}) {
            BasicText("Mon–Sat 9:00–20:00", style = Kometa.type.body.copy(color = Kometa.colors.text2))
        }
        KometaFold("Address", open = false, onOpenChange = {}) {}
        KometaSkeleton(rows = 1)
        KometaTabbar(
            listOf(KometaTab("home", "Home"), KometaTab("book", "Bookings"), KometaTab("me", "Profile")),
            value = "book", onValueChange = {},
            icon = { Box(Modifier.size(18.dp).background(LocalKometaContentColor.current, CircleShape)) },
        )
    }

    @Test fun overlays() = shoot("gallery3", 760) {
        Box(Modifier.fillMaxSize()) {
            KometaHeading("Overlays")
            KometaToasts(
                listOf(
                    KometaToastItem(1, "Booking saved", KometaToastKind.Success, life = 60_000),
                    KometaToastItem(2, "Payment failed", KometaToastKind.Error, life = 60_000),
                ),
                onDismiss = {},
                modifier = Modifier.align(Alignment.Center),
            )
            KometaDrawer(visible = true, onDismiss = {}, label = "Book") {
                Column(Modifier.padding(20.dp), verticalArrangement = Arrangement.spacedBy(14.dp)) {
                    BasicText("Book a time", style = Kometa.type.title.copy(color = Kometa.colors.text))
                    KometaField("", {}, label = "Your name")
                    KometaButton("Confirm", {}, Modifier.fillMaxWidth())
                }
            }
        }
    }

    @Test fun more() = shoot("gallery4", 1400) {
        KometaCrumbs(listOf("Shops", "Barber Shop", "Services"), onPick = {})
        KometaSearch("", {}, label = "Search", placeholder = "Find a barber")
        KometaSearch("fade", {}, label = "Search", clearLabel = "Clear")
        KometaAvatars(listOf("Ali Valiyev", "Sardor", "Madina K", "Bek", "Olim", "Zarina").map { KometaAvatar(it) })
        Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.Bottom) {
            KometaNumber(12480, {}, label = "Price", money = true, suffix = "so'm", modifier = Modifier.weight(1f))
            KometaNumber(null, {}, label = "Seats", placeholder = "0")
        }
        KometaDigits("901234567", {}, label = "Phone")
        KometaSelect(listOf("Owner", "Barber", "Admin"), "Barber", {}, prefix = "Role:")
        KometaSelect(listOf("Today", "This week"), null, {}, placeholder = "Any day", pill = true)
        KometaTally(12480, max = 20000, unit = "so'm this week")
        KometaCountdown(duration = 60, from = 42, label = "to confirm")
        KometaAccordionItem("Can I cancel a booking?", open = true, onOpenChange = {}) {
            BasicText("Up to two hours before it starts, from the booking itself.", style = Kometa.type.body.copy(color = Kometa.colors.muted))
        }
        KometaAccordionItem("Do you take cards?", open = false, onOpenChange = {}) {}
        KometaPair("Keep it", "Delete", {}, {})
        KometaPair("Cancel", "Save", {}, {}, primary = true, busy = true)
    }
}
