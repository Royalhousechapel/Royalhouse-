import React, { useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Alert,
  Image,
  ImageBackground,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/hooks/useColors';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type ScreenName = 'home' | 'sermons' | 'give' | 'events' | 'profile' | 'prayer' | 'ministries';

const logo = require('../../assets/images/royalhouse-mark.png');
const worshipBackground = require('../../assets/images/worship-bg.jpg');

const sermonData = [
  { title: 'The Sound of the King', speaker: 'Apostle General', series: 'Kingdom Culture', duration: '48 min', color: '#17275B' },
  { title: 'Built For More', speaker: 'Pastor Lydia O.', series: 'Faith That Moves', duration: '36 min', color: '#6C5321' },
  { title: 'The Place of Prayer', speaker: 'Rev. Daniel K.', series: 'Encounter', duration: '42 min', color: '#253C58' },
];

const eventData = [
  { month: 'AUG', day: '16', title: 'Global Worship Service', detail: 'Sunday · 9:00 AM WAT', location: 'Victory Center Worldwide' },
  { month: 'AUG', day: '22', title: 'Royal Ladies Gathering', detail: 'Saturday · 3:00 PM WAT', location: 'Online + Accra Branch' },
  { month: 'SEP', day: '05', title: 'Men Makers Summit', detail: 'Saturday · 10:00 AM WAT', location: 'Headquarters Auditorium' },
];

const ministryData = [
  { name: 'Royal Ladies', icon: 'human-female', description: 'Raising women of influence, grace, and kingdom impact.' },
  { name: 'Men Makers', icon: 'account-tie', description: 'Equipping men to lead with strength, wisdom, and faith.' },
  { name: 'WMG', icon: 'earth', description: 'World Movers Generation for a purpose-driven next generation.' },
  { name: 'Worship', icon: 'music-note', description: 'Creating room for people to encounter God through worship.' },
  { name: 'Prayer', icon: 'hands-pray', description: 'Standing together in faith for lives, cities, and nations.' },
  { name: 'Children', icon: 'human-child', description: 'Helping children discover the joy of following Jesus.' },
];

const givingCategories = ['Tithes', 'Offerings', 'First Fruits', 'Faith Seed', 'Building', 'Missions', 'Welfare', 'Royal Ladies'];

function ActionButton({
  label,
  icon,
  onPress,
  variant = 'primary',
  full = false,
}: {
  label: string;
  icon?: IconName;
  onPress: () => void;
  variant?: 'primary' | 'outline' | 'gold' | 'ghost';
  full?: boolean;
}) {
  const colors = useColors();
  return (
    <Pressable
      testID={`button-${label.toLowerCase().replaceAll(' ', '-')}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionButton,
        full && styles.actionButtonFull,
        variant === 'primary' && { backgroundColor: colors.primary },
        variant === 'gold' && { backgroundColor: colors.accent },
        variant === 'outline' && { borderColor: colors.border, backgroundColor: colors.card },
        variant === 'ghost' && { backgroundColor: 'transparent' },
        pressed && styles.pressed,
      ]}
    >
      {icon ? <Ionicons name={icon} size={16} color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.primaryForeground} /> : null}
      <Text style={[styles.actionButtonText, { color: variant === 'outline' || variant === 'ghost' ? colors.primary : colors.primaryForeground }]}>{label}</Text>
    </Pressable>
  );
}

function SectionHeader({ title, action, onPress }: { title: string; action?: string; onPress?: () => void }) {
  const colors = useColors();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{title}</Text>
      {action && onPress ? (
        <Pressable onPress={onPress} hitSlop={12}>
          <Text style={[styles.sectionAction, { color: colors.accent }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function Header({ onProfile }: { onProfile: () => void }) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.topBar, { paddingTop: insets.top + 10, backgroundColor: colors.primary }]}>
      <View style={styles.brandRow}>
        <Image source={logo} style={styles.headerLogo} resizeMode="contain" />
        <View>
          <Text style={styles.brandName}>ROYALHOUSE</Text>
          <Text style={styles.brandSubname}>CHAPEL WORLDWIDE</Text>
        </View>
      </View>
      <Pressable testID="button-notifications" onPress={() => Alert.alert('Notifications', 'You are all caught up.')} style={styles.headerIcon}>
        <Ionicons name="notifications-outline" size={21} color="#FFFFFF" />
        <View style={styles.notificationDot} />
      </Pressable>
      <Pressable testID="button-profile" onPress={onProfile} style={[styles.avatar, { backgroundColor: colors.accent }]}>
        <Text style={styles.avatarText}>O</Text>
      </Pressable>
    </View>
  );
}

function HomeScreen({ navigate }: { navigate: (screen: ScreenName) => void }) {
  const colors = useColors();
  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <Header onProfile={() => navigate('profile')} />
      <View style={styles.greetingRow}>
        <View>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>WELCOME HOME</Text>
          <Text style={[styles.greeting, { color: colors.foreground }]}>Hi, Clement Bolarinwa</Text>
          <Text style={[styles.greetingSub, { color: colors.mutedForeground }]}>Your kingdom family is here.</Text>
        </View>
        <View style={[styles.onlinePill, { backgroundColor: '#E7F5EC' }]}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>Online</Text>
        </View>
      </View>

      <ImageBackground source={worshipBackground} imageStyle={styles.heroImage} style={styles.heroCard}>
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <View style={styles.liveBadge}><View style={styles.liveDot} /><Text style={styles.liveText}>LIVE THIS SUNDAY</Text></View>
          <Text style={styles.heroTitle}>There is a place for you in the house.</Text>
          <Text style={styles.heroBody}>Join a global family learning to live, love, and lead like Jesus.</Text>
          <View style={styles.heroActions}>
            <ActionButton label="Watch live" icon="play" variant="gold" onPress={() => Alert.alert('Live service', 'The next live service begins Sunday at 9:00 AM WAT.')} />
            <ActionButton label="Plan a visit" icon="location-outline" variant="ghost" onPress={() => Alert.alert('Find a branch', 'Branch locator is ready for the next phase.')} />
          </View>
        </View>
      </ImageBackground>

      <View style={styles.quickActions}>
        <QuickAction label="Give" icon="heart-outline" onPress={() => navigate('give')} />
        <QuickAction label="Prayer" icon="hands-pray" material onPress={() => navigate('prayer')} />
        <QuickAction label="Sermons" icon="play-circle-outline" onPress={() => navigate('sermons')} />
        <QuickAction label="Events" icon="calendar-outline" onPress={() => navigate('events')} />
      </View>

      <SectionHeader title="Daily inspiration" />
      <View style={[styles.devotionalCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.quoteMark, { backgroundColor: colors.accent }]}><Text style={styles.quoteMarkText}>“</Text></View>
        <View style={styles.devotionalCopy}>
          <Text style={[styles.devotionalTitle, { color: colors.foreground }]}>You are built for kingdom impact.</Text>
          <Text style={[styles.devotionalText, { color: colors.mutedForeground }]}>“Arise, shine, for your light has come.” · Isaiah 60:1</Text>
        </View>
        <Ionicons name="arrow-forward" size={18} color={colors.accent} />
      </View>

      <SectionHeader title="Continue listening" action="View all" onPress={() => navigate('sermons')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
        {sermonData.map((sermon, index) => (
          <Pressable key={sermon.title} onPress={() => navigate('sermons')} style={({ pressed }) => [styles.sermonCard, pressed && styles.pressed]}>
            <View style={[styles.sermonArtwork, { backgroundColor: sermon.color }]}>
              <View style={styles.artworkLines} />
              <Text style={styles.artworkNumber}>0{index + 1}</Text>
              <Ionicons name="play" size={18} color="#FFFFFF" style={styles.artworkPlay} />
            </View>
            <Text style={[styles.sermonTitle, { color: colors.foreground }]} numberOfLines={1}>{sermon.title}</Text>
            <Text style={[styles.sermonMeta, { color: colors.mutedForeground }]}>{sermon.speaker} · {sermon.duration}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <SectionHeader title="Coming up" action="See calendar" onPress={() => navigate('events')} />
      {eventData.slice(0, 2).map((event) => <EventRow key={event.title} event={event} onPress={() => navigate('events')} />)}

      <SectionHeader title="Find your ministry" action="Explore" onPress={() => navigate('ministries')} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalList}>
        {ministryData.slice(0, 4).map((ministry) => (
          <Pressable key={ministry.name} onPress={() => navigate('ministries')} style={({ pressed }) => [styles.ministryTile, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}>
            <View style={[styles.ministryIcon, { backgroundColor: '#F8F1D7' }]}>
              <MaterialCommunityIcons name={ministry.icon as never} size={21} color={colors.accent} />
            </View>
            <Text style={[styles.ministryName, { color: colors.foreground }]}>{ministry.name}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

function QuickAction({ label, icon, onPress, material = false }: { label: string; icon: string; onPress: () => void; material?: boolean }) {
  const colors = useColors();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.quickAction, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}>
      <View style={[styles.quickIcon, { backgroundColor: '#F7F1D8' }]}>
        {material ? <MaterialCommunityIcons name={icon as never} size={20} color={colors.accent} /> : <Ionicons name={icon as IconName} size={20} color={colors.accent} />}
      </View>
      <Text style={[styles.quickLabel, { color: colors.foreground }]}>{label}</Text>
    </Pressable>
  );
}

export function SermonsScreen({ navigate }: { navigate: (screen: ScreenName) => void }) {
  const colors = useColors();
  const [saved, setSaved] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => sermonData.filter((item) => `${item.title} ${item.speaker} ${item.series}`.toLowerCase().includes(query.toLowerCase())), [query]);
  const toggleSave = (title: string) => setSaved((items) => items.includes(title) ? items.filter((item) => item !== title) : [...items, title]);
  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <SimplePageHeader eyebrow="THE WORD" title="Listen & grow" subtitle="Messages for wherever you are in your walk." />
      <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Ionicons name="search" size={19} color={colors.mutedForeground} />
        <TextInput value={query} onChangeText={setQuery} placeholder="Search sermons, speakers, topics" placeholderTextColor={colors.mutedForeground} style={[styles.searchInput, { color: colors.foreground }]} />
      </View>
      <View style={styles.filterRow}>
        {['All', 'Video', 'Audio', 'Saved'].map((filter, index) => <Pressable key={filter} onPress={() => filter === 'Saved' && setQuery('')} style={[styles.filterChip, { backgroundColor: index === 0 ? colors.primary : colors.card, borderColor: colors.border }]}><Text style={[styles.filterText, { color: index === 0 ? '#FFFFFF' : colors.foreground }]}>{filter}</Text></Pressable>)}
      </View>
      <SectionHeader title="Featured messages" />
      {filtered.map((sermon, index) => (
        <Pressable key={sermon.title} onPress={() => Alert.alert('Now playing', sermon.title)} style={({ pressed }) => [styles.sermonListCard, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}>
          <View style={[styles.listArtwork, { backgroundColor: sermon.color }]}><Text style={styles.artworkNumber}>0{index + 1}</Text><Ionicons name="play" size={16} color="#FFFFFF" /></View>
          <View style={styles.listCopy}><Text style={[styles.listTitle, { color: colors.foreground }]}>{sermon.title}</Text><Text style={[styles.listMeta, { color: colors.mutedForeground }]}>{sermon.series} · {sermon.speaker}</Text><Text style={[styles.listDuration, { color: colors.mutedForeground }]}>{sermon.duration}  ·  Video & audio</Text></View>
          <Pressable onPress={() => toggleSave(sermon.title)} hitSlop={12}><Ionicons name={saved.includes(sermon.title) ? 'bookmark' : 'bookmark-outline'} size={20} color={saved.includes(sermon.title) ? colors.accent : colors.mutedForeground} /></Pressable>
        </Pressable>
      ))}
      {filtered.length === 0 ? <EmptyState icon="search-outline" title="No messages found" body="Try another speaker, topic, or series." /> : null}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

export function GiveScreen() {
  const colors = useColors();
  const [category, setCategory] = useState('Tithes');
  const [amount, setAmount] = useState('');
  const [recurring, setRecurring] = useState(false);
  const [frequency, setFrequency] = useState('Every month');
  const [saved, setSaved] = useState(false);
  const submitGiving = async () => {
    const numericAmount = Number(amount.replace(/[^0-9.]/g, ''));
    if (!numericAmount || numericAmount <= 0) {
      Alert.alert('Enter an amount', 'Please enter the amount you would like to give.');
      return;
    }
    await AsyncStorage.setItem('royalhouse-last-gift', JSON.stringify({ category, amount: numericAmount, recurring, frequency }));
    setSaved(true);
    Alert.alert('Giving prepared', `Your ${category.toLowerCase()} gift of $${numericAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} is ready for secure checkout.`);
  };
  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <SimplePageHeader eyebrow="GENEROSITY" title="Give with purpose" subtitle="Your generosity helps the gospel reach homes, cities, and nations." />
      <View style={[styles.givingHero, { backgroundColor: colors.primary }]}>
        <View style={styles.givingHeroCircle} />
        <Text style={styles.givingHeroLabel}>YOUR GIVING MATTERS</Text>
        <Text style={styles.givingHeroTitle}>Every seed carries a story.</Text>
        <Text style={styles.givingHeroBody}>Give securely to the work God is doing through Royalhouse Chapel Worldwide.</Text>
      </View>
      <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Choose a fund</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
        {givingCategories.map((item) => <Pressable key={item} onPress={() => setCategory(item)} style={[styles.categoryChip, { backgroundColor: category === item ? colors.accent : colors.card, borderColor: category === item ? colors.accent : colors.border }]}><Text style={[styles.categoryText, { color: category === item ? '#FFFFFF' : colors.foreground }]}>{item}</Text></Pressable>)}
      </ScrollView>
      <View style={[styles.amountCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.amountLabel, { color: colors.mutedForeground }]}>AMOUNT TO GIVE</Text>
        <View style={styles.amountRow}><Text style={[styles.currency, { color: colors.foreground }]}>$</Text><TextInput testID="input-giving-amount" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} placeholder="0.00" placeholderTextColor="#A9B0C1" style={[styles.amountInput, { color: colors.foreground }]} /></View>
        <Text style={[styles.amountHint, { color: colors.mutedForeground }]}>You can edit this amount anytime before checkout.</Text>
      </View>
      <View style={styles.segmentLabelRow}><Text style={[styles.fieldLabel, { color: colors.foreground }]}>Gift type</Text><Text style={[styles.secureNote, { color: colors.mutedForeground }]}><Ionicons name="lock-closed" size={12} /> Secure</Text></View>
      <View style={[styles.segment, { borderColor: colors.border, backgroundColor: colors.card }]}><Pressable onPress={() => setRecurring(false)} style={[styles.segmentItem, !recurring && { backgroundColor: colors.primary }]}><Text style={[styles.segmentText, { color: !recurring ? '#FFFFFF' : colors.foreground }]}>Give one time</Text></Pressable><Pressable onPress={() => setRecurring(true)} style={[styles.segmentItem, recurring && { backgroundColor: colors.accent }]}><Text style={[styles.segmentText, { color: recurring ? '#FFFFFF' : colors.foreground }]}>Set up recurring</Text></Pressable></View>
      {recurring ? <><Text style={[styles.fieldLabel, { color: colors.foreground, marginTop: 18 }]}>Frequency</Text><View style={styles.frequencyRow}>{['Every week', 'Every 2 weeks', 'Every month'].map((item) => <Pressable key={item} onPress={() => setFrequency(item)} style={[styles.frequencyItem, { backgroundColor: frequency === item ? colors.accent : colors.card, borderColor: colors.border }]}><Text style={[styles.frequencyText, { color: frequency === item ? '#FFFFFF' : colors.foreground }]}>{item}</Text></Pressable>)}</View></> : null}
      <View style={[styles.fundInfo, { backgroundColor: '#F8F1D7' }]}><Ionicons name="information-circle-outline" size={20} color={colors.accent} /><Text style={[styles.fundInfoText, { color: colors.foreground }]}>{category} gifts support the mission and ministry areas selected by you.</Text></View>
      <ActionButton label={saved ? 'Gift saved' : 'Continue to secure checkout'} icon={saved ? 'checkmark-circle' : 'arrow-forward-circle'} variant="gold" full onPress={submitGiving} />
      <Text style={[styles.disclaimer, { color: colors.mutedForeground }]}>Payments are securely processed. Royalhouse Chapel does not store your card details.</Text>
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

function EventsScreen() {
  const colors = useColors();
  const [registered, setRegistered] = useState<string[]>([]);
  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
      <SimplePageHeader eyebrow="GATHER TOGETHER" title="Events & moments" subtitle="There is something powerful about doing life and faith together." />
      <View style={[styles.calendarBanner, { backgroundColor: colors.primary }]}><View><Text style={styles.calendarEyebrow}>NEXT GLOBAL GATHERING</Text><Text style={styles.calendarTitle}>Global Worship Service</Text><Text style={styles.calendarMeta}>Sunday, 16 August · 9:00 AM WAT</Text></View><Ionicons name="calendar" size={35} color={colors.accent} /></View>
      <SectionHeader title="Upcoming events" action="My calendar" onPress={() => Alert.alert('My calendar', 'You have no saved events yet.')} />
      {eventData.map((event) => <EventRow key={event.title} event={event} registered={registered.includes(event.title)} onPress={() => setRegistered((items) => items.includes(event.title) ? items.filter((item) => item !== event.title) : [...items, event.title])} />)}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
}

function EventRow({ event, onPress, registered = false }: { event: typeof eventData[number]; onPress: () => void; registered?: boolean }) {
  const colors = useColors();
  return <Pressable testID={`event-${event.title}`} onPress={onPress} style={({ pressed }) => [styles.eventRow, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}>
    <View style={[styles.dateBlock, { backgroundColor: '#F8F1D7' }]}><Text style={[styles.dateMonth, { color: colors.accent }]}>{event.month}</Text><Text style={[styles.dateDay, { color: colors.foreground }]}>{event.day}</Text></View>
    <View style={styles.eventCopy}><Text style={[styles.eventTitle, { color: colors.foreground }]}>{event.title}</Text><Text style={[styles.eventDetail, { color: colors.mutedForeground }]}>{event.detail}</Text><Text style={[styles.eventLocation, { color: colors.mutedForeground }]}><Ionicons name="location-outline" size={12} /> {event.location}</Text></View>
    <View style={[styles.eventChevron, { backgroundColor: registered ? '#E7F5EC' : colors.secondary }]}>{registered ? <Ionicons name="checkmark" size={17} color="#2B8A4B" /> : <Ionicons name="arrow-forward" size={17} color={colors.primary} />}</View>
  </Pressable>;
}

function PrayerScreen({ close }: { close: () => void }) {
  const colors = useColors();
  const [request, setRequest] = useState('');
  const [privateRequest, setPrivateRequest] = useState(true);
  const submit = async () => {
    if (request.trim().length < 10) {
      Alert.alert('Tell us a little more', 'Please share at least a few words so our prayer team can stand with you.');
      return;
    }
    await AsyncStorage.setItem(`royalhouse-prayer-${Date.now()}`, JSON.stringify({ request, privateRequest }));
    setRequest('');
    Alert.alert('Prayer request received', 'Our prayer team will stand with you. You are not alone.', [{ text: 'Done', onPress: close }]);
  };
  return <Modal animationType="slide" visible onRequestClose={close}><ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={[styles.scrollContent, { paddingTop: 64 }]} keyboardShouldPersistTaps="handled">
    <Pressable onPress={close} style={styles.closeButton}><Ionicons name="close" size={23} color={colors.foreground} /></Pressable>
    <Text style={[styles.eyebrow, { color: colors.accent }]}>PRAYER CENTER</Text><Text style={[styles.pageTitle, { color: colors.foreground }]}>We will stand with you.</Text><Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>Share what is on your heart. Our prayer team receives every request with care.</Text>
    <View style={[styles.prayerIcon, { backgroundColor: colors.primary }]}><MaterialCommunityIcons name="hands-pray" size={34} color={colors.accent} /></View>
    <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Your prayer request</Text>
    <TextInput testID="input-prayer-request" multiline value={request} onChangeText={setRequest} placeholder="I would like prayer for..." placeholderTextColor={colors.mutedForeground} style={[styles.prayerInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }]} textAlignVertical="top" />
    <Pressable onPress={() => setPrivateRequest(!privateRequest)} style={styles.checkboxRow}><View style={[styles.checkbox, { borderColor: privateRequest ? colors.accent : colors.border, backgroundColor: privateRequest ? colors.accent : colors.card }]}>{privateRequest ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}</View><View><Text style={[styles.checkboxTitle, { color: colors.foreground }]}>Keep this request private</Text><Text style={[styles.checkboxSub, { color: colors.mutedForeground }]}>Only the prayer team will see it.</Text></View></Pressable>
    <ActionButton label="Submit prayer request" icon="heart-outline" variant="gold" full onPress={submit} />
  </ScrollView></Modal>;
}

function MinistriesScreen({ close }: { close: () => void }) {
  const colors = useColors();
  return <Modal animationType="slide" visible onRequestClose={close}><ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={[styles.scrollContent, { paddingTop: 64 }]}><Pressable onPress={close} style={styles.closeButton}><Ionicons name="close" size={23} color={colors.foreground} /></Pressable><Text style={[styles.eyebrow, { color: colors.accent }]}>YOUR KINGDOM FAMILY</Text><Text style={[styles.pageTitle, { color: colors.foreground }]}>Find your place.</Text><Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>Every gift, age, and story has a place in the Royalhouse family.</Text>{ministryData.map((ministry) => <Pressable key={ministry.name} onPress={() => Alert.alert(ministry.name, ministry.description)} style={({ pressed }) => [styles.ministryRow, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}><View style={[styles.ministryIcon, { backgroundColor: '#F8F1D7' }]}><MaterialCommunityIcons name={ministry.icon as never} size={22} color={colors.accent} /></View><View style={styles.ministryRowCopy}><Text style={[styles.ministryRowTitle, { color: colors.foreground }]}>{ministry.name}</Text><Text style={[styles.ministryRowBody, { color: colors.mutedForeground }]}>{ministry.description}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} /></Pressable>)}<View style={styles.bottomSpacer} /></ScrollView></Modal>;
}

export function ProfileScreen({ navigate }: { navigate: (screen: ScreenName) => void }) {
  const colors = useColors();
  return <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scrollContent}><View style={[styles.profileHero, { backgroundColor: colors.primary }]}><View style={[styles.profileAvatar, { backgroundColor: colors.accent }]}><Text style={styles.profileAvatarText}>C</Text></View><Text style={styles.profileName}>Clement Bolarinwa</Text><Text style={styles.profileBranch}>Royalhouse Victory Center · Member</Text><View style={styles.memberBadge}><Ionicons name="shield-checkmark" size={14} color={colors.accent} /><Text style={[styles.memberBadgeText, { color: colors.accent }]}>MEMBER SINCE 2024</Text></View></View><SectionHeader title="Your kingdom journey" /><View style={styles.profileGrid}><ProfileStat value="12" label="Saved sermons" icon="bookmark-outline" /><ProfileStat value="04" label="Events joined" icon="calendar-outline" /><ProfileStat value="08" label="Prayer updates" icon="heart-outline" /><ProfileStat value="$450" label="This year giving" icon="gift-outline" /></View><SectionHeader title="Quick access" /><ProfileMenu label="Digital member ID" detail="Your membership card" icon="card-outline" onPress={() => Alert.alert('Digital member ID', 'Your member ID will be available here once your profile is verified.')} /><ProfileMenu label="Giving history" detail="View gifts and receipts" icon="receipt-outline" onPress={() => navigate('give')} /><ProfileMenu label="Saved resources" detail="Sermons and library items" icon="library-outline" onPress={() => navigate('sermons')} /><ProfileMenu label="Notification settings" detail="Stay connected to the house" icon="notifications-outline" onPress={() => Alert.alert('Notifications', 'Notification preferences are ready to configure.')} /><View style={styles.bottomSpacer} /></ScrollView>;
}

function ProfileStat({ value, label, icon }: { value: string; label: string; icon: IconName }) {
  const colors = useColors();
  return <View style={[styles.profileStat, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name={icon} size={18} color={colors.accent} /><Text style={[styles.profileStatValue, { color: colors.foreground }]}>{value}</Text><Text style={[styles.profileStatLabel, { color: colors.mutedForeground }]}>{label}</Text></View>;
}

function ProfileMenu({ label, detail, icon, onPress }: { label: string; detail: string; icon: IconName; onPress: () => void }) {
  const colors = useColors();
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.profileMenu, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}><View style={[styles.menuIcon, { backgroundColor: '#F8F1D7' }]}><Ionicons name={icon} size={20} color={colors.accent} /></View><View style={styles.menuCopy}><Text style={[styles.menuLabel, { color: colors.foreground }]}>{label}</Text><Text style={[styles.menuDetail, { color: colors.mutedForeground }]}>{detail}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} /></Pressable>;
}

function SimplePageHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  const colors = useColors();
  return <View style={styles.pageHeader}><Text style={[styles.eyebrow, { color: colors.accent }]}>{eyebrow}</Text><Text style={[styles.pageTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>{subtitle}</Text></View>;
}

function EmptyState({ icon, title, body }: { icon: IconName; title: string; body: string }) {
  const colors = useColors();
  return <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name={icon} size={28} color={colors.accent} /><Text style={[styles.emptyTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>{body}</Text></View>;
}

export default function HomeTab() {
  const [screen, setScreen] = useState<ScreenName>('home');
  const navigate = (next: ScreenName) => setScreen(next);
  if (screen === 'prayer') return <PrayerScreen close={() => setScreen('home')} />;
  if (screen === 'ministries') return <MinistriesScreen close={() => setScreen('home')} />;
  if (screen === 'sermons') return <SermonsScreen navigate={navigate} />;
  if (screen === 'give') return <GiveScreen />;
  if (screen === 'events') return <EventsScreen />;
  if (screen === 'profile') return <ProfileScreen navigate={navigate} />;
  return <HomeScreen navigate={navigate} />;
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 20 },
  bottomSpacer: { height: 72 },
  topBar: { paddingHorizontal: 20, paddingBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
  brandRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9 },
  headerLogo: { width: 39, height: 39, borderRadius: 8, backgroundColor: '#090D18' },
  brandName: { color: '#FFFFFF', fontSize: 13, fontWeight: '800', letterSpacing: 1.4 },
  brandSubname: { color: '#D9C56D', fontSize: 8, fontWeight: '700', letterSpacing: 1.1, marginTop: 2 },
  headerIcon: { width: 33, height: 33, alignItems: 'center', justifyContent: 'center' },
  notificationDot: { position: 'absolute', top: 5, right: 4, width: 6, height: 6, borderRadius: 3, backgroundColor: '#D7B72A', borderWidth: 1, borderColor: '#142557' },
  avatar: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  greetingRow: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 18, flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  eyebrow: { fontSize: 10, fontWeight: '800', letterSpacing: 1.8 },
  greeting: { fontSize: 24, lineHeight: 30, fontWeight: '700', marginTop: 5 },
  greetingSub: { fontSize: 13, marginTop: 3 },
  onlinePill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 20, gap: 5 },
  onlineDot: { width: 6, height: 6, backgroundColor: '#2B8A4B', borderRadius: 3 },
  onlineText: { color: '#2B8A4B', fontSize: 11, fontWeight: '700' },
  heroCard: { marginHorizontal: 16, minHeight: 268, borderRadius: 18, overflow: 'hidden', justifyContent: 'flex-end' },
  heroImage: { borderRadius: 18 },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(9, 18, 49, 0.63)' },
  heroContent: { padding: 20 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#E0BC2A' },
  liveText: { color: '#E5D27C', fontWeight: '800', fontSize: 10, letterSpacing: 1.4 },
  heroTitle: { color: '#FFFFFF', fontSize: 27, lineHeight: 32, fontWeight: '700', maxWidth: 300 },
  heroBody: { color: '#DDE4F3', fontSize: 13, lineHeight: 19, marginTop: 9, maxWidth: 300 },
  heroActions: { flexDirection: 'row', alignItems: 'center', marginTop: 18, gap: 7 },
  actionButton: { minHeight: 40, paddingHorizontal: 14, borderRadius: 9, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, borderWidth: 1 },
  actionButtonFull: { marginHorizontal: 16, minHeight: 52, borderRadius: 12 },
  actionButtonText: { fontSize: 13, fontWeight: '700' },
  pressed: { opacity: 0.72, transform: [{ scale: 0.985 }] },
  quickActions: { flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 18, gap: 8 },
  quickAction: { flex: 1, minHeight: 83, borderRadius: 12, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: '#0D1D49', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  quickIcon: { width: 35, height: 35, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 11, fontWeight: '600' },
  sectionHeader: { paddingHorizontal: 20, marginTop: 10, marginBottom: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  sectionAction: { fontSize: 12, fontWeight: '700' },
  devotionalCard: { marginHorizontal: 16, padding: 15, borderRadius: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 12 },
  quoteMark: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  quoteMarkText: { color: '#FFFFFF', fontFamily: 'serif', fontSize: 26, lineHeight: 30 },
  devotionalCopy: { flex: 1 },
  devotionalTitle: { fontSize: 14, fontWeight: '700' },
  devotionalText: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  horizontalList: { paddingHorizontal: 16, gap: 12 },
  sermonCard: { width: 174 },
  sermonArtwork: { height: 105, borderRadius: 13, overflow: 'hidden', padding: 12, justifyContent: 'space-between' },
  artworkLines: { position: 'absolute', width: 220, height: 220, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', borderRadius: 110, right: -100, top: -40 },
  artworkNumber: { color: 'rgba(255,255,255,0.65)', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  artworkPlay: { alignSelf: 'flex-end' },
  sermonTitle: { fontSize: 13, fontWeight: '700', marginTop: 9 },
  sermonMeta: { fontSize: 10, marginTop: 3 },
  ministryTile: { width: 126, minHeight: 106, padding: 12, borderWidth: 1, borderRadius: 13, justifyContent: 'space-between' },
  ministryIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  ministryName: { fontWeight: '700', fontSize: 12 },
  pageHeader: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 19 },
  pageTitle: { fontSize: 30, lineHeight: 36, fontWeight: '700', marginTop: 6 },
  pageSubtitle: { fontSize: 14, lineHeight: 20, marginTop: 8, maxWidth: 340 },
  searchBox: { marginHorizontal: 16, height: 48, borderWidth: 1, borderRadius: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
  searchInput: { flex: 1, fontSize: 13 },
  filterRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, paddingTop: 14, paddingBottom: 4 },
  filterChip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 18, borderWidth: 1 },
  filterText: { fontSize: 12, fontWeight: '700' },
  sermonListCard: { marginHorizontal: 16, marginBottom: 11, padding: 11, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 11 },
  listArtwork: { width: 61, height: 61, borderRadius: 11, alignItems: 'center', justifyContent: 'space-between', padding: 8 },
  listCopy: { flex: 1 },
  listTitle: { fontSize: 14, fontWeight: '700' },
  listMeta: { fontSize: 11, marginTop: 4 },
  listDuration: { fontSize: 10, marginTop: 5 },
  emptyState: { margin: 16, padding: 30, alignItems: 'center', borderWidth: 1, borderRadius: 14 },
  emptyTitle: { marginTop: 10, fontSize: 15, fontWeight: '700' },
  emptyBody: { marginTop: 5, fontSize: 12, textAlign: 'center' },
  givingHero: { marginHorizontal: 16, borderRadius: 18, padding: 21, minHeight: 168, overflow: 'hidden' },
  givingHeroCircle: { position: 'absolute', right: -50, top: -65, width: 190, height: 190, borderRadius: 95, borderWidth: 1, borderColor: 'rgba(211,183,42,0.32)' },
  givingHeroLabel: { color: '#D9C56D', fontSize: 10, fontWeight: '800', letterSpacing: 1.6 },
  givingHeroTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 25, marginTop: 12 },
  givingHeroBody: { color: '#DDE4F3', fontSize: 13, lineHeight: 19, marginTop: 8, maxWidth: 280 },
  fieldLabel: { paddingHorizontal: 20, fontSize: 14, fontWeight: '700', marginTop: 20, marginBottom: 10 },
  categoryList: { paddingHorizontal: 16, gap: 8 },
  categoryChip: { paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderRadius: 10 },
  categoryText: { fontSize: 12, fontWeight: '700' },
  amountCard: { marginHorizontal: 16, borderRadius: 14, borderWidth: 1, padding: 18, marginTop: 5 },
  amountLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.3 },
  amountRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  currency: { fontSize: 28, fontWeight: '500' },
  amountInput: { fontSize: 42, fontWeight: '300', flex: 1, paddingVertical: 2 },
  amountHint: { fontSize: 11, marginTop: 7 },
  segmentLabelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingRight: 20 },
  secureNote: { fontSize: 11 },
  segment: { marginHorizontal: 16, flexDirection: 'row', borderRadius: 9, borderWidth: 1, overflow: 'hidden' },
  segmentItem: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  segmentText: { fontSize: 12, fontWeight: '700' },
  frequencyRow: { flexDirection: 'row', paddingHorizontal: 16, gap: 7 },
  frequencyItem: { flex: 1, borderWidth: 1, borderRadius: 9, paddingVertical: 12, alignItems: 'center' },
  frequencyText: { fontSize: 11, textAlign: 'center', fontWeight: '600' },
  fundInfo: { marginHorizontal: 16, marginTop: 19, padding: 13, borderRadius: 11, flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  fundInfoText: { flex: 1, fontSize: 11, lineHeight: 16 },
  disclaimer: { textAlign: 'center', fontSize: 10, paddingHorizontal: 30, marginTop: 11 },
  calendarBanner: { marginHorizontal: 16, padding: 18, borderRadius: 15, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  calendarEyebrow: { color: '#D9C56D', fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  calendarTitle: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', marginTop: 7 },
  calendarMeta: { color: '#DDE4F3', fontSize: 11, marginTop: 4 },
  eventRow: { marginHorizontal: 16, marginBottom: 10, borderRadius: 13, borderWidth: 1, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 12 },
  dateBlock: { width: 52, height: 62, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  dateMonth: { fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  dateDay: { fontSize: 23, lineHeight: 26, fontWeight: '700', marginTop: 2 },
  eventCopy: { flex: 1 },
  eventTitle: { fontSize: 13, fontWeight: '700' },
  eventDetail: { fontSize: 11, marginTop: 4 },
  eventLocation: { fontSize: 10, marginTop: 5 },
  eventChevron: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  closeButton: { position: 'absolute', right: 20, top: 20, width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EDEFF5', zIndex: 2 },
  prayerIcon: { width: 72, height: 72, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginHorizontal: 20, marginBottom: 4 },
  prayerInput: { marginHorizontal: 16, minHeight: 150, borderWidth: 1, borderRadius: 13, padding: 14, fontSize: 14, lineHeight: 21 },
  checkboxRow: { margin: 19, flexDirection: 'row', gap: 10, alignItems: 'center' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  checkboxTitle: { fontSize: 13, fontWeight: '700' },
  checkboxSub: { fontSize: 11, marginTop: 3 },
  ministryRow: { marginHorizontal: 16, marginBottom: 10, padding: 12, borderRadius: 13, borderWidth: 1, flexDirection: 'row', gap: 12, alignItems: 'center' },
  ministryRowCopy: { flex: 1 },
  ministryRowTitle: { fontSize: 14, fontWeight: '700' },
  ministryRowBody: { fontSize: 11, lineHeight: 16, marginTop: 4 },
  profileHero: { paddingTop: 42, paddingBottom: 25, alignItems: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  profileAvatar: { width: 73, height: 73, borderRadius: 37, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.35)' },
  profileAvatarText: { color: '#FFFFFF', fontSize: 32, fontWeight: '700' },
  profileName: { color: '#FFFFFF', fontSize: 21, fontWeight: '700', marginTop: 11 },
  profileBranch: { color: '#DDE4F3', fontSize: 11, marginTop: 4 },
  memberBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 14, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.1)' },
  memberBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  profileGrid: { flexDirection: 'row', paddingHorizontal: 16, gap: 8 },
  profileStat: { flex: 1, minHeight: 102, padding: 11, borderRadius: 12, borderWidth: 1 },
  profileStatValue: { fontSize: 19, fontWeight: '700', marginTop: 13 },
  profileStatLabel: { fontSize: 10, lineHeight: 14, marginTop: 3 },
  profileMenu: { marginHorizontal: 16, marginBottom: 9, padding: 12, borderWidth: 1, borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 11 },
  menuIcon: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  menuCopy: { flex: 1 },
  menuLabel: { fontSize: 13, fontWeight: '700' },
  menuDetail: { fontSize: 11, marginTop: 3 },
});