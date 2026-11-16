package uz.kometa.sample

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicText
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.semantics.Role
import androidx.compose.ui.unit.dp
import uz.kometa.ui.*

// Media pages (photos, frame, carousel, reveal, person, avatars, logo). The kit loads no images:
// gradients stand in for photos here; an app passes an `Image` from its own image library.

private fun shade(top: Long, bottom: Long) = Brush.verticalGradient(listOf(Color(top), Color(bottom)))

private data class Work(val title: String, val by: String, val picture: Brush)

private val works = listOf(
    Work("Low fade", "Aziza · 40 min", shade(0xFF3A2F22, 0xFF14120E)),
    Work("Beard trim", "Dilshod · 25 min", shade(0xFF22303A, 0xFF0E1214)),
    Work("Kids cut", "Malika · 30 min", shade(0xFF2F3A22, 0xFF11140E)),
    Work("Hot towel shave", "Zafar · 35 min", shade(0xFF3A2228, 0xFF140E10)),
)

private val dusk = shade(0xFF3A2E5C, 0xFFE8A15A)
private val noon = shade(0xFF2C6E8F, 0xFFB8E0D2)

private val guests = listOf("Aziza Karimova", "Dilshod Saidov", "Malika Rashidova", "Zafar Tursunov", "Nodira Bakirova", "Umid Olimov")
    .map { KometaAvatar(it) }

// ---------------------------------------------------------------- photos

@Composable
internal fun PhotosGallery() {
    // #region photos/gallery
    var open by remember { mutableStateOf(false) }
    var index by remember { mutableIntStateOf(0) }
    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
        works.forEachIndexed { i, w ->
            Box(Modifier.size(64.dp).clip(RoundedCornerShape(8.dp)).background(w.picture).clickable { index = i; open = true })
        }
    }
    KometaPhotos(
        works.size, open, { open = it }, index, { index = it },
        photo = { i -> Box(Modifier.size(320.dp).background(works[i].picture)) },
        thumb = { i -> Box(Modifier.fillMaxSize().background(works[i].picture)) },
        label = "Photos",
        onDownload = { /* save works[it] */ },
    )
    // #endregion
}

@Composable
internal fun PhotosInContext() {
    // #region photos/in-context
    var open by remember { mutableStateOf(false) }
    var index by remember { mutableIntStateOf(0) }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            KometaPerson("Aziz Rahimov", Modifier.weight(1f), meta = "Barber · 212 visits")
            KometaStars(4.9f, "4.9 out of 5")
        }
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp)) {
            works.forEachIndexed { i, w ->
                Box(Modifier.weight(1f).height(80.dp).clip(RoundedCornerShape(10.dp)).background(w.picture).clickable { index = i; open = true })
            }
        }
    }
    KometaPhotos(
        works.size, open, { open = it }, index, { index = it },
        photo = { i -> Box(Modifier.size(320.dp).background(works[i].picture)) },
        label = "Aziz's work",
    )
    // #endregion
}

@Composable
internal fun PhotosBare() {
    // #region photos/photos-bare
    var open by remember { mutableStateOf(false) }
    var index by remember { mutableIntStateOf(0) }
    KometaButton("Open photos", { open = true }, variant = KometaButtonVariant.Outlined)
    // No onDownload: no Download button. thumbs = false: no strip of thumbnails.
    KometaPhotos(
        works.size, open, { open = it }, index, { index = it },
        photo = { i -> Box(Modifier.size(320.dp).background(works[i].picture)) },
        label = "Photos", thumbs = false,
    )
    // #endregion
}

// ---------------------------------------------------------------- frame

@Composable
internal fun FrameFrame() {
    // #region frame/frame
    KometaFrame(caption = "A framed picture") {
        Box(Modifier.fillMaxWidth().height(180.dp).background(dusk))
    }
    // #endregion
}

@Composable
internal fun FrameInContext() {
    // #region frame/in-context
    Column(verticalArrangement = Arrangement.spacedBy(16.dp)) {
        KometaFrame {
            Column {
                Box(Modifier.fillMaxWidth().height(160.dp).background(works[0].picture))
                Row(Modifier.fillMaxWidth().padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                    KometaPerson("Aziz Rahimov", Modifier.weight(1f), meta = "Skin fade · 2 days ago", size = KometaPersonSize.Sm)
                    KometaTag("New", tone = KometaTagTone.Now)
                }
            }
        }
        KometaFrame {
            Column {
                Box(Modifier.fillMaxWidth().height(160.dp).background(works[2].picture))
                KometaPerson("Malika Yusupova", Modifier.padding(12.dp), meta = "Balayage · last week", size = KometaPersonSize.Sm)
            }
        }
    }
    // #endregion
}

@Composable
internal fun FrameSlot() {
    // #region frame/frame-slot
    // The caption is a plain string; for a richer one, draw it yourself under the frame.
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        KometaFrame { Box(Modifier.fillMaxWidth().height(180.dp).background(dusk)) }
        Row {
            BasicText("Shot by ", style = Kometa.type.body.copy(color = Kometa.colors.muted))
            BasicText("Dilnoza", style = Kometa.type.body.copy(color = Kometa.colors.text))
        }
    }
    // #endregion
}

// ---------------------------------------------------------------- carousel

@Composable
internal fun CarouselBasic() {
    // #region carousel/basic
    var slide by remember { mutableIntStateOf(0) }
    KometaCarousel(works.size, slide, { slide = it }, label = "Works") { i ->
        Box(Modifier.fillMaxWidth().height(200.dp).background(works[i].picture), contentAlignment = Alignment.BottomStart) {
            Column(Modifier.padding(12.dp)) {
                BasicText(works[i].title, style = Kometa.type.md.copy(color = Kometa.colors.text))
                BasicText(works[i].by, style = Kometa.type.small.copy(color = Kometa.colors.muted))
            }
        }
    }
    // #endregion
}

@Composable
internal fun CarouselInContext() {
    // #region carousel/in-context
    var slide by remember { mutableIntStateOf(0) }
    var booked by remember { mutableStateOf("") }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        KometaPerson("Aziza Karimova", meta = "Master · 6 years")
        KometaCarousel(works.size, slide, { slide = it }, label = "Aziza's work", slideLabel = "Work") { i ->
            Box(Modifier.fillMaxWidth().height(180.dp).background(works[i].picture), contentAlignment = Alignment.BottomStart) {
                BasicText(works[i].title, Modifier.padding(12.dp), style = Kometa.type.md.copy(color = Kometa.colors.text))
            }
        }
        Row(Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            KometaStars(4.8f, "4.8 out of 5", Modifier.weight(1f))
            KometaButton("Book ${works[slide].title}", { booked = works[slide].title }, small = true)
        }
        if (booked.isNotEmpty()) BasicText("Booking $booked", style = Kometa.type.small.copy(color = Kometa.colors.muted))
    }
    // #endregion
}

@Composable
internal fun CarouselPlain() {
    // #region carousel/carousel-plain
    var slide by remember { mutableIntStateOf(0) }
    KometaCarousel(works.size, slide, { slide = it }, edges = false, label = "Works", slideLabel = "Work") { i ->
        Box(Modifier.fillMaxWidth().height(200.dp).background(works[i].picture), contentAlignment = Alignment.BottomStart) {
            BasicText(works[i].title, Modifier.padding(12.dp), style = Kometa.type.md.copy(color = Kometa.colors.text))
        }
    }
    // #endregion
}

// ---------------------------------------------------------------- reveal

@Composable
internal fun RevealBasic() {
    // #region reveal/basic
    var position by remember { mutableIntStateOf(50) }
    KometaReveal(
        position, { position = it },
        before = { Box(Modifier.fillMaxSize().background(dusk)) },
        after = { Box(Modifier.fillMaxSize().background(noon)) },
        Modifier.size(280.dp, 320.dp),
        description = "Before and after",
    )
    // #endregion
}

@Composable
internal fun RevealInContext() {
    // #region reveal/in-context
    var position by remember { mutableIntStateOf(50) }
    var booked by remember { mutableStateOf(false) }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        KometaPerson("Malika Yusupova", meta = "Stylist · Yunusobod")
        KometaReveal(
            position, { position = it },
            before = { Box(Modifier.fillMaxSize().background(works[2].picture)) },
            after = { Box(Modifier.fillMaxSize().background(dusk)) },
            Modifier.fillMaxWidth(),
            afterLabel = "After 2 h", aspectRatio = 4f / 3f, description = "Balayage, before and after",
        )
        BasicText("Balayage on long hair · from 450 000 so'm", style = Kometa.type.small.copy(color = Kometa.colors.muted))
        KometaButton(if (booked) "Booked ✓" else "Book this look", { booked = true }, enabled = !booked)
    }
    // #endregion
}

@Composable
internal fun RevealOptions() {
    // #region reveal/reveal-options
    var position by remember { mutableIntStateOf(50) }
    KometaReveal(
        position, { position = it },
        before = { Box(Modifier.fillMaxSize().background(dusk)) },
        after = { Box(Modifier.fillMaxSize().background(noon)) },
        Modifier.fillMaxWidth(),
        aspectRatio = 16f / 9f, showLabels = false, description = "Wide, unlabelled",
    )
    // #endregion
}

// ---------------------------------------------------------------- avatars

@Composable
internal fun AvatarsBasic() {
    // #region avatars/basic
    val guests = listOf("Aziza Karimova", "Dilshod Saidov", "Malika Rashidova", "Zafar Tursunov", "Nodira Bakirova", "Umid Olimov")
        .map { KometaAvatar(it) }
    KometaAvatars(guests, moreLabel = "and {n} others")
    // #endregion
}

@Composable
internal fun AvatarsInContext() {
    // #region avatars/in-context
    var sent by remember { mutableStateOf(false) }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        BasicText("Saturday, 10:00 · Wedding party", style = Kometa.type.md.copy(color = Kometa.colors.text))
        Row(horizontalArrangement = Arrangement.spacedBy(12.dp), verticalAlignment = Alignment.CenterVertically) {
            KometaAvatars(guests)
            KometaTag("${guests.size} guests", tone = KometaTagTone.Book)
        }
        KometaButton(
            if (sent) "Reminder sent to ${guests.size} guests" else "Remind them all", { sent = true },
            Modifier.fillMaxWidth(), severity = KometaSeverity.Secondary,
        )
    }
    // #endregion
}

@Composable
internal fun AvatarsSize() {
    // #region avatars/avatars-size
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        KometaAvatars(guests, max = 3, size = KometaPersonSize.Sm)
        KometaAvatars(guests, max = 6, size = KometaPersonSize.Lg)
    }
    // #endregion
}

// ---------------------------------------------------------------- person

@Composable
internal fun PersonPerson() {
    // #region person/person
    Row(horizontalArrangement = Arrangement.spacedBy(16.dp), verticalAlignment = Alignment.CenterVertically) {
        KometaPerson("Dilnoza Karimova", meta = "Master")
        KometaPerson("Aziz", size = KometaPersonSize.Sm)
        // image draws the photo in place of the initials: an Image from your image library.
        KometaPerson("Shop", square = true, size = KometaPersonSize.Lg, image = { Box(Modifier.fillMaxSize().background(dusk)) })
        KometaPerson("Bare", bare = true)
    }
    // #endregion
}

private data class Master(val name: String, val meta: String, val score: Float)

@Composable
internal fun PersonInContext() {
    // #region person/in-context
    val crew = listOf(
        Master("Any master", "First free chair", 0f),
        Master("Aziz Rahimov", "Barber · from 80 000", 4.9f),
        Master("Dilnoza Karimova", "Stylist · from 120 000", 4.7f),
        Master("Jasur Nazarov", "Barber · from 70 000", 4.3f),
    )
    var pick by remember { mutableStateOf("Any master") }
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        crew.forEach { m ->
            val shape = RoundedCornerShape(12.dp)
            KometaPerson(
                m.name,
                Modifier.fillMaxWidth().clip(shape)
                    .border(1.dp, if (pick == m.name) Kometa.colors.amber else Kometa.colors.glassLine, shape)
                    .selectable(pick == m.name, role = Role.RadioButton) { pick = m.name }
                    .padding(10.dp),
                meta = m.meta,
                initials = if (m.score == 0f) "★" else m.name.split(" ").joinToString("") { it.take(1) },
                trailing = { if (m.score > 0f) KometaStars(m.score, "${m.score} out of 5", size = 12.dp) },
            )
        }
        KometaButton("Continue with $pick", {})
    }
    // #endregion
}

@Composable
internal fun PersonInitials() {
    // #region person/person-initials
    KometaPerson("Dilnoza Karimova", meta = "Master", initials = "DK")
    // #endregion
}

// ---------------------------------------------------------------- logo

@Composable
internal fun LogoBasic() {
    // #region logo/basic
    Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
            KometaProviderLogo("Click")
            BasicText("Click", style = Kometa.type.md.copy(color = Kometa.colors.text))
        }
        Row(horizontalArrangement = Arrangement.spacedBy(6.dp), verticalAlignment = Alignment.CenterVertically) {
            KometaProviderLogo("Payme")
            BasicText("Payme", style = Kometa.type.md.copy(color = Kometa.colors.text))
        }
    }
    // #endregion
}

@Composable
internal fun LogoInContext() {
    // #region logo/in-context
    var payBy by remember { mutableStateOf("Click") }
    var paid by remember { mutableStateOf("") }
    Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
        listOf("Click", "Payme").forEach { p ->
            val shape = RoundedCornerShape(12.dp)
            Row(
                Modifier.fillMaxWidth().clip(shape)
                    .border(1.dp, if (payBy == p) Kometa.colors.amber else Kometa.colors.glassLine, shape)
                    .selectable(payBy == p, role = Role.RadioButton) { payBy = p }
                    .padding(12.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                KometaProviderLogo(p, size = 24.dp)
                BasicText(p, Modifier.weight(1f), style = Kometa.type.md.copy(color = Kometa.colors.text))
                if (p == "Click") KometaTag("5% cashback", tone = KometaTagTone.Done, dot = false)
            }
        }
        KometaButton("Pay 120 000 so'm with $payBy", { paid = payBy }, Modifier.fillMaxWidth())
        if (paid.isNotEmpty()) BasicText("Paying 120 000 with $paid", style = Kometa.type.small.copy(color = Kometa.colors.muted))
    }
    // #endregion
}

internal val MEDIA_EXAMPLES = mapOf(
    "photos/gallery" to DocExample { PhotosGallery() },
    "photos/in-context" to DocExample { PhotosInContext() },
    "photos/photos-bare" to DocExample { PhotosBare() },
    "frame/frame" to DocExample { FrameFrame() },
    "frame/in-context" to DocExample { FrameInContext() },
    "frame/frame-slot" to DocExample { FrameSlot() },
    "carousel/basic" to DocExample { CarouselBasic() },
    "carousel/in-context" to DocExample { CarouselInContext() },
    "carousel/carousel-plain" to DocExample { CarouselPlain() },
    "reveal/basic" to DocExample { RevealBasic() },
    "reveal/in-context" to DocExample { RevealInContext() },
    "reveal/reveal-options" to DocExample { RevealOptions() },
    "avatars/basic" to DocExample { AvatarsBasic() },
    "avatars/in-context" to DocExample { AvatarsInContext() },
    "avatars/avatars-size" to DocExample { AvatarsSize() },
    "person/person" to DocExample { PersonPerson() },
    "person/in-context" to DocExample { PersonInContext() },
    "person/person-initials" to DocExample { PersonInitials() },
    "logo/basic" to DocExample { LogoBasic() },
    "logo/in-context" to DocExample { LogoInContext() },
)
