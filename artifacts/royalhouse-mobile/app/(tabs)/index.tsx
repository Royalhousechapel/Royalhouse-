import React, { useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Alert,
  Image,
  ImageBackground,
  Linking,
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
import { useAuth } from '@clerk/expo';
import { useQueryClient } from '@tanstack/react-query';
import {
  getListBranchesQueryKey,
  getGetAdminProfileQueryKey,
  getListConnectPeopleQueryKey,
  getGetConnectPersonProfileQueryKey,
  getGetConnectSummaryQueryKey,
  useArchiveBranch,
  useCreateBranch,
  useCreateConnectPerson,
  useCompleteConnectFollowUp,
  useGetAdminProfile,
  useGetConnectPersonProfile,
  useGetConnectSummary,
  useListConnectPeople,
  useListConnectWorkflowOptions,
  useLogConnectInteraction,
  useListBranches,
  useUpdateBranch,
  setPreviewRoleGetter,
} from '@workspace/api-client-react';
import type { Branch as ApiBranch, ConnectPerson, WorkflowOption } from '@workspace/api-client-react';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
type ScreenName = 'home' | 'sermons' | 'give' | 'events' | 'profile' | 'prayer' | 'ministries' | 'branches' | 'admin';

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
type AdminRole = 'Super Admin' | 'Headquarters Admin' | 'Regional Admin' | 'Branch Admin' | 'Pastor' | 'Ministry Leader' | 'Finance Team' | 'Media Team' | 'Store Manager' | 'Connect Team Leader' | 'Connect Team Member' | 'Pastoral Leadership' | 'Church Administrator' | 'Finance Administrator' | 'Finance Team Member' | 'Foundation School Administrator' | 'Foundation School Team Member' | 'Ministries Administrator' | 'Media Administrator' | 'Media Team Member' | 'Events Administrator' | 'Events Team Member' | 'Communications Administrator' | 'Membership Administrator' | 'Branch Administrator' | 'Regular Member' | 'Visitor';
type AdminModule = 'Members' | 'Connect Team' | 'Branches' | 'Ministries' | 'Sermons & Media' | 'Events' | 'Finance & Giving' | 'Communication' | 'Digital Store' | 'Users & Roles' | 'Settings' | 'Audit Logs';

type PreviewRoleOption = { department: string; role: AdminRole; icon: IconName };
const previewRoleOptions: PreviewRoleOption[] = [
  { department: 'Leadership', role: 'Super Admin', icon: 'shield-checkmark-outline' },
  { department: 'Leadership', role: 'Pastoral Leadership', icon: 'people-outline' },
  { department: 'Leadership', role: 'Church Administrator', icon: 'briefcase-outline' },
  { department: 'Connect Team', role: 'Connect Team Leader', icon: 'call-outline' },
  { department: 'Connect Team', role: 'Connect Team Member', icon: 'call-outline' },
  { department: 'Finance', role: 'Finance Administrator', icon: 'card-outline' },
  { department: 'Finance', role: 'Finance Team Member', icon: 'card-outline' },
  { department: 'Foundation School', role: 'Foundation School Administrator', icon: 'school-outline' },
  { department: 'Foundation School', role: 'Foundation School Team Member', icon: 'school-outline' },
  { department: 'Ministries', role: 'Ministry Leader', icon: 'people-outline' },
  { department: 'Ministries', role: 'Ministries Administrator', icon: 'briefcase-outline' },
  { department: 'Media', role: 'Media Administrator', icon: 'play-circle-outline' },
  { department: 'Media', role: 'Media Team Member', icon: 'play-circle-outline' },
  { department: 'Events', role: 'Events Administrator', icon: 'calendar-outline' },
  { department: 'Events', role: 'Events Team Member', icon: 'calendar-outline' },
  { department: 'Communications', role: 'Communications Administrator', icon: 'chatbubbles-outline' },
  { department: 'Membership', role: 'Membership Administrator', icon: 'people-outline' },
  { department: 'Branch Administration', role: 'Branch Administrator', icon: 'location-outline' },
  { department: 'Member', role: 'Regular Member', icon: 'person-outline' },
  { department: 'Visitor', role: 'Visitor', icon: 'walk-outline' },
];
const moduleIcons: Record<AdminModule, IconName> = {
  Members: 'people-outline',
  'Connect Team': 'call-outline',
  Branches: 'location-outline',
  Ministries: 'briefcase-outline',
  'Sermons & Media': 'play-circle-outline',
  Events: 'calendar-outline',
  'Finance & Giving': 'card-outline',
  Communication: 'chatbubbles-outline',
  'Digital Store': 'bag-handle-outline',
  'Users & Roles': 'shield-checkmark-outline',
  Settings: 'settings-outline',
  'Audit Logs': 'time-outline',
};
const modulePermissions: Record<AdminRole, AdminModule[]> = {
  'Super Admin': Object.keys(moduleIcons) as AdminModule[],
  'Headquarters Admin': ['Members', 'Branches', 'Ministries', 'Sermons & Media', 'Events', 'Finance & Giving', 'Communication', 'Digital Store', 'Audit Logs'],
  'Regional Admin': ['Members', 'Branches', 'Ministries', 'Events', 'Communication', 'Audit Logs'],
  'Branch Admin': ['Members', 'Branches', 'Ministries', 'Events', 'Communication'],
  Pastor: ['Members', 'Branches', 'Ministries', 'Sermons & Media', 'Events', 'Communication'],
  'Ministry Leader': ['Members', 'Ministries', 'Events', 'Communication', 'Sermons & Media'],
  'Finance Team': ['Finance & Giving', 'Members', 'Audit Logs'],
  'Media Team': ['Sermons & Media', 'Communication', 'Events'],
  'Store Manager': ['Digital Store', 'Events', 'Audit Logs'],
  'Connect Team Leader': ['Members', 'Connect Team', 'Communication'],
  'Connect Team Member': ['Connect Team'],
  'Pastoral Leadership': ['Members', 'Connect Team', 'Communication', 'Audit Logs'],
  'Church Administrator': ['Members', 'Connect Team', 'Branches', 'Ministries', 'Events', 'Communication', 'Audit Logs'],
  'Finance Administrator': ['Finance & Giving', 'Members', 'Audit Logs'],
  'Finance Team Member': ['Finance & Giving'],
  'Foundation School Administrator': ['Members', 'Ministries', 'Events', 'Communication'],
  'Foundation School Team Member': ['Members', 'Events'],
  'Ministries Administrator': ['Members', 'Ministries', 'Events', 'Communication'],
  'Media Administrator': ['Sermons & Media', 'Communication', 'Events'],
  'Media Team Member': ['Sermons & Media'],
  'Events Administrator': ['Events', 'Communication'],
  'Events Team Member': ['Events'],
  'Communications Administrator': ['Communication', 'Events'],
  'Membership Administrator': ['Members', 'Communication'],
  'Branch Administrator': ['Branches', 'Members', 'Events'],
  'Regular Member': [],
  Visitor: [],
};

type Branch = {
  id?: string;
  name: string;
  country: string;
  region: string;
  city: string;
  address: string;
  pastor: string;
  coordinates: { latitude: number; longitude: number };
  featured?: boolean;
  archived?: boolean;
};

function apiBranchToBranch(branch: ApiBranch): Branch {
  return {
    id: branch.id,
    name: branch.name,
    country: branch.country,
    region: branch.region,
    city: branch.city,
    address: branch.address,
    pastor: branch.pastor,
    coordinates: { latitude: branch.latitude, longitude: branch.longitude },
    featured: branch.featured,
    archived: branch.archived,
  };
}

// These are the locations explicitly named in the uploaded Global Branch Directory brief.
// Additional branch profiles should be added through the future Headquarters CMS.
const branchData: Branch[] = [
  {
    name: 'International Headquarters (Ahenfie)',
    country: 'Ghana',
    region: 'Greater Accra Region',
    city: 'Accra',
    address: 'Oil Dome · Ring Road West · Accra, Ghana',
    pastor: 'Headquarters leadership',
    coordinates: { latitude: 5.56, longitude: -0.2 },
    featured: true,
  },
  {
    name: 'Royalhouse Chapel Connecticut',
    country: 'United States',
    region: 'Connecticut',
    city: 'Connecticut',
    address: 'Official branch address managed by Headquarters',
    pastor: 'Branch leadership profile coming soon',
    coordinates: { latitude: 41.6, longitude: -72.7 },
  },
  {
    name: 'Royalhouse Chapel Maryland',
    country: 'United States',
    region: 'Maryland',
    city: 'Maryland',
    address: 'Grace2Grace Center',
    pastor: 'Branch leadership profile coming soon',
    coordinates: { latitude: 39.05, longitude: -76.64 },
  },
  {
    name: 'Royalhouse Chapel Massachusetts',
    country: 'United States',
    region: 'Massachusetts',
    city: 'Massachusetts',
    address: 'Mt. Zion Center',
    pastor: 'Branch leadership profile coming soon',
    coordinates: { latitude: 42.36, longitude: -71.06 },
  },
  {
    name: 'Royalhouse Chapel Georgia',
    country: 'United States',
    region: 'Georgia',
    city: 'Georgia',
    address: 'Miracle Life Center',
    pastor: 'Branch leadership profile coming soon',
    coordinates: { latitude: 33.75, longitude: -84.39 },
  },
  {
    name: 'Royalhouse Chapel Toronto',
    country: 'Canada',
    region: 'Ontario',
    city: 'Toronto',
    address: 'Official branch address managed by Headquarters',
    pastor: 'Branch leadership profile coming soon',
    coordinates: { latitude: 43.65, longitude: -79.38 },
  },
];

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
            <ActionButton label="Plan a visit" icon="location-outline" variant="ghost" onPress={() => navigate('branches')} />
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

export function BranchesScreen({ close, standalone = false }: { close: () => void; standalone?: boolean }) {
  const colors = useColors();
  const [query, setQuery] = useState('');
  const [country, setCountry] = useState('All');
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const { data: apiBranches, isLoading: branchesLoading } = useListBranches();
  const countries = ['All', 'United States', 'Ghana', 'Canada'];
  const branches: Branch[] = apiBranches?.map(apiBranchToBranch) ?? [];
  const activeBranches = branches.filter((branch) => !branch.archived);
  const filteredBranches = useMemo(() => activeBranches.filter((branch) => {
    const matchesCountry = country === 'All' || branch.country === country;
    const searchText = `${branch.name} ${branch.country} ${branch.region} ${branch.city} ${branch.pastor}`.toLowerCase();
    return matchesCountry && searchText.includes(query.toLowerCase().trim());
  }), [activeBranches, country, query]);

  const openDirections = (branch: Branch) => {
    const destination = encodeURIComponent(`${branch.name}, ${branch.address}, ${branch.city}, ${branch.country}`);
    Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${destination}`).catch(() => {
      Alert.alert('Directions unavailable', 'Please search for this branch in your preferred maps app.');
    });
  };

  const showContactInfo = (branch: Branch) => {
    Alert.alert('Branch contact', `${branch.name}\n\nContact details are managed by Headquarters and will appear here once published.`);
  };

  const mapPosition = (branch: Branch) => ({
    left: `${Math.max(6, Math.min(90, ((branch.coordinates.longitude + 130) / 175) * 100))}%` as `${number}%`,
    top: `${Math.max(10, Math.min(84, (1 - branch.coordinates.latitude / 62) * 100))}%` as `${number}%`,
  });

  const content = (
      <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={[styles.scrollContent, { paddingTop: 62 }]} showsVerticalScrollIndicator={false}>
        <Pressable onPress={close} style={styles.closeButton}><Ionicons name="close" size={23} color={colors.foreground} /></Pressable>
        <View style={styles.pageHeader}>
          <Text style={[styles.eyebrow, { color: colors.accent }]}>ROYALHOUSE WORLDWIDE</Text>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Find your branch.</Text>
          <Text style={[styles.pageSubtitle, { color: colors.mutedForeground }]}>A growing global family, one local assembly at a time.</Text>
        </View>

        <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Ionicons name="search" size={19} color={colors.mutedForeground} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search branch, city, or pastor" placeholderTextColor={colors.mutedForeground} style={[styles.searchInput, { color: colors.foreground }]} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
          {countries.map((item) => (
            <Pressable key={item} onPress={() => setCountry(item)} style={[styles.categoryChip, { backgroundColor: country === item ? colors.accent : colors.card, borderColor: country === item ? colors.accent : colors.border }]}>
              <Text style={[styles.categoryText, { color: country === item ? '#FFFFFF' : colors.foreground }]}>{item}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={[styles.mapPanel, { backgroundColor: colors.primary }]}>
          <View style={styles.mapGridLineHorizontalOne} />
          <View style={styles.mapGridLineHorizontalTwo} />
          <View style={styles.mapGridLineVerticalOne} />
          <View style={styles.mapGridLineVerticalTwo} />
          <View style={styles.mapLandOne} />
          <View style={styles.mapLandTwo} />
          <Text style={styles.mapLabel}>GLOBAL BRANCH MAP</Text>
          {activeBranches.map((branch) => (
            <Pressable key={branch.name} onPress={() => setSelectedBranch(branch)} style={[styles.mapPin, mapPosition(branch)]}>
              <View style={[styles.mapPinDot, { backgroundColor: selectedBranch?.name === branch.name ? '#FFFFFF' : colors.accent, borderColor: selectedBranch?.name === branch.name ? colors.accent : colors.primary }]} />
            </Pressable>
          ))}
          <View style={styles.mapLegend}><View style={[styles.mapPinDot, { backgroundColor: colors.accent }]} /><Text style={styles.mapLegendText}>{branchesLoading ? 'Loading locations…' : `${activeBranches.length} listed locations`}</Text></View>
        </View>

        {selectedBranch ? (
          <View style={[styles.branchDetailCard, { backgroundColor: colors.card, borderColor: colors.accent }]}>
            <View style={styles.branchDetailHeader}>
              <View style={[styles.branchLogoSmall, { backgroundColor: colors.primary }]}><Image source={logo} style={styles.branchLogoImage} resizeMode="contain" /></View>
              <View style={styles.branchDetailTitleCopy}><Text style={[styles.branchDetailName, { color: colors.foreground }]}>{selectedBranch.name}</Text><Text style={[styles.branchDetailRegion, { color: colors.accent }]}>{selectedBranch.city} · {selectedBranch.country}</Text></View>
              <Pressable onPress={() => setSelectedBranch(null)} hitSlop={12}><Ionicons name="close-circle-outline" size={21} color={colors.mutedForeground} /></Pressable>
            </View>
            <View style={[styles.branchInfoLine, { borderTopColor: colors.border }]}><Ionicons name="location-outline" size={17} color={colors.accent} /><Text style={[styles.branchInfoText, { color: colors.foreground }]}>{selectedBranch.address}</Text></View>
            <View style={styles.branchInfoLine}><Ionicons name="person-outline" size={17} color={colors.accent} /><Text style={[styles.branchInfoText, { color: colors.foreground }]}>{selectedBranch.pastor}</Text></View>
            <View style={styles.branchActionRow}>
              <Pressable onPress={() => openDirections(selectedBranch)} style={[styles.branchAction, { backgroundColor: colors.primary }]}><Ionicons name="navigate-outline" size={17} color="#FFFFFF" /><Text style={styles.branchActionText}>Directions</Text></Pressable>
              <Pressable onPress={() => showContactInfo(selectedBranch)} style={[styles.branchAction, { backgroundColor: '#F8F1D7' }]}><Ionicons name="call-outline" size={17} color={colors.accent} /><Text style={[styles.branchActionText, { color: colors.foreground }]}>Contact</Text></Pressable>
            </View>
            <Text style={[styles.pendingLabel, { color: colors.mutedForeground }]}>Service times, ministries, events, livestream, and branch contacts will appear as Headquarters publishes each profile.</Text>
          </View>
        ) : null}

        <SectionHeader title={`${filteredBranches.length} listed locations`} action="Clear" onPress={() => { setQuery(''); setCountry('All'); }} />
        {filteredBranches.map((branch) => (
          <Pressable key={branch.name} onPress={() => setSelectedBranch(branch)} style={({ pressed }) => [styles.branchListRow, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}>
            <View style={[styles.branchListIcon, { backgroundColor: colors.primary }]}><Image source={logo} style={styles.branchListLogo} resizeMode="contain" /></View>
            <View style={styles.branchListCopy}><Text style={[styles.branchListName, { color: colors.foreground }]}>{branch.name}</Text><Text style={[styles.branchListMeta, { color: colors.mutedForeground }]}>{branch.city}, {branch.country}</Text><Text style={[styles.branchListAddress, { color: colors.mutedForeground }]}>{branch.address}</Text></View>
            <Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} />
          </Pressable>
        ))}
        {filteredBranches.length === 0 ? <EmptyState icon="location-outline" title="No branches found" body="Try a different country, city, or branch name." /> : null}
        <View style={[styles.directoryNote, { backgroundColor: '#F8F1D7' }]}><Ionicons name="shield-checkmark-outline" size={19} color={colors.accent} /><Text style={[styles.directoryNoteText, { color: colors.foreground }]}>This directory starts with locations named in the official brief. Headquarters can add and update unlimited branch profiles through the future admin dashboard.</Text></View>
        <View style={styles.bottomSpacer} />
      </ScrollView>
  );

  return standalone ? content : <Modal animationType="slide" visible onRequestClose={close}>{content}</Modal>;
}

export function AdminDashboardScreen({ close, standalone = false }: { close: () => void; standalone?: boolean }) {
  const colors = useColors();
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const adminProfile = useGetAdminProfile({ query: { queryKey: getGetAdminProfileQueryKey(), enabled: Boolean(isSignedIn), retry: false } });
  const branchQuery = useListBranches();
  const createBranchMutation = useCreateBranch();
  const updateBranchMutation = useUpdateBranch();
  const archiveBranchMutation = useArchiveBranch();
  const role = adminProfile.data?.role as AdminRole | undefined;
  const [previewRole, setPreviewRole] = useState<AdminRole | null>(null);
  const [showPreviewPicker, setShowPreviewPicker] = useState(false);
  const [previewSearch, setPreviewSearch] = useState('');
  const effectiveRole = previewRole ?? role;
  useEffect(() => {
    setPreviewRoleGetter(() => previewRole);
    void queryClient.invalidateQueries();
    return () => setPreviewRoleGetter(null);
  }, [previewRole, queryClient]);
  const connectSummary = useGetConnectSummary({
    query: {
      queryKey: getGetConnectSummaryQueryKey(),
      enabled: Boolean(effectiveRole && modulePermissions[effectiveRole]?.includes('Connect Team')),
    },
  });
  const [activeModule, setActiveModule] = useState<AdminModule | 'Overview'>('Overview');
  const [showBranchForm, setShowBranchForm] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [branchForm, setBranchForm] = useState({ name: '', country: 'United States', region: '', city: '', address: '' });
  const branches = branchQuery.data?.map(apiBranchToBranch) ?? [];
  const permittedModules = effectiveRole ? modulePermissions[effectiveRole] : [];
  const visiblePreviewRoles = previewRoleOptions.filter((option) =>
    `${option.department} ${option.role}`.toLowerCase().includes(previewSearch.trim().toLowerCase()),
  );
  const activeBranches = branches.filter((branch) => !branch.archived);
  const openAddBranch = () => {
    setEditingBranch(null);
    setBranchForm({ name: '', country: 'United States', region: '', city: '', address: '' });
    setShowBranchForm(true);
  };
  const openEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setBranchForm({ name: branch.name, country: branch.country, region: branch.region, city: branch.city, address: branch.address });
    setShowBranchForm(true);
  };
  const saveBranch = async () => {
    if (!branchForm.name.trim() || !branchForm.city.trim()) {
      Alert.alert('Missing branch details', 'Add a branch name and city before saving.');
      return;
    }
    const coordinateDefaults: Record<string, { latitude: number; longitude: number }> = {
      'United States': { latitude: 39, longitude: -96 },
      Ghana: { latitude: 7.9, longitude: -1.2 },
      Canada: { latitude: 56, longitude: -106 },
    };
    const payload = {
      name: branchForm.name.trim(),
      country: branchForm.country,
      region: branchForm.region.trim() || 'Region to be assigned',
      city: branchForm.city.trim(),
      address: branchForm.address.trim() || 'Branch address to be published',
      pastor: editingBranch?.pastor ?? 'Branch leadership profile coming soon',
      latitude: editingBranch?.coordinates.latitude ?? coordinateDefaults[branchForm.country].latitude,
      longitude: editingBranch?.coordinates.longitude ?? coordinateDefaults[branchForm.country].longitude,
      featured: editingBranch?.featured ?? false,
    };
    try {
      if (editingBranch?.id) {
        await updateBranchMutation.mutateAsync({ id: editingBranch.id, data: payload });
      } else {
        await createBranchMutation.mutateAsync({ data: payload });
      }
      await queryClient.invalidateQueries({ queryKey: getListBranchesQueryKey() });
      setShowBranchForm(false);
      setActiveModule('Branches');
      Alert.alert(editingBranch ? 'Branch updated' : 'Branch added', `${payload.name} is now available in the global directory.`);
    } catch (error) {
      Alert.alert('Could not save branch', error instanceof Error ? error.message : 'Please try again.');
    }
  };
  const archiveBranch = (branch: Branch) => {
    if (!branch.id) return;
    Alert.alert('Archive branch?', `${branch.name} will be hidden from the public directory.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Archive', style: 'destructive', onPress: async () => {
        try {
          await archiveBranchMutation.mutateAsync({ id: branch.id! });
          await queryClient.invalidateQueries({ queryKey: getListBranchesQueryKey() });
        } catch (error) {
          Alert.alert('Could not archive branch', error instanceof Error ? error.message : 'Please try again.');
        }
      } },
    ]);
  };

  const workspaceCopy: Record<AdminModule, { title: string; body: string; primary: string; secondary: string }> = {
    Members: { title: 'Member management', body: 'Search member profiles, assign branches and ministries, and keep membership history together.', primary: 'Add member', secondary: 'Export members' },
    'Connect Team': { title: 'Connect Team', body: 'Turn every visitor and member touchpoint into a clear next action, with assignment, care flags, and follow-up history.', primary: 'Open Connect Team', secondary: 'View follow-up queue' },
    Branches: { title: 'Branch management', body: 'Keep every local assembly current from one place. Changes sync to the member branch directory.', primary: 'Add branch', secondary: 'View archived' },
    Ministries: { title: 'Ministry management', body: 'Assign leaders, coordinate ministry events, share resources, and follow participation.', primary: 'Create ministry', secondary: 'View reports' },
    'Sermons & Media': { title: 'Sermons & media', body: 'Organize video, audio, sermon notes, speakers, categories, and publishing schedules.', primary: 'Upload sermon', secondary: 'Open media library' },
    Events: { title: 'Event management', body: 'Create gatherings, manage registrations, track attendees, and send reminders.', primary: 'Create event', secondary: 'View registrations' },
    'Finance & Giving': { title: 'Finance & giving', body: 'Review dollar giving summaries, designated funds, receipts, campaigns, and finance reports.', primary: 'View transactions', secondary: 'Export report' },
    Communication: { title: 'Communication center', body: 'Prepare announcements for branches, ministries, events, and member audiences.', primary: 'Create announcement', secondary: 'Message history' },
    'Digital Store': { title: 'Digital store', body: 'Manage books, authors, products, inventory, pricing, orders, and customer resources.', primary: 'Add product', secondary: 'View orders' },
    'Users & Roles': { title: 'Users & roles', body: 'Assign role-based access and review who can manage each part of the ministry platform.', primary: 'Create user', secondary: 'Permission matrix' },
    Settings: { title: 'System settings', body: 'Manage church information, branding, app settings, notifications, integrations, and security.', primary: 'Open settings', secondary: 'Security review' },
    'Audit Logs': { title: 'Audit logs', body: 'Review administrative activity with the user, action, timestamp, and change history.', primary: 'View full log', secondary: 'Export audit log' },
  };
  const copy = activeModule === 'Overview' ? null : workspaceCopy[activeModule];
  const actionFeedback = (label: string) => {
    if (activeModule === 'Branches' && label === 'Add branch') {
      openAddBranch();
      return;
    }
    Alert.alert(label, `${label} is ready for the ${effectiveRole ?? 'administrator'} workspace.`);
  };
  if (!isSignedIn) {
    return <View style={[styles.accessState, { backgroundColor: colors.background }]}><View style={[styles.accessIcon, { backgroundColor: colors.primary }]}><Ionicons name="lock-closed" size={27} color={colors.accent} /></View><Text style={[styles.accessTitle, { color: colors.foreground }]}>Admin sign-in required</Text><Text style={[styles.accessBody, { color: colors.mutedForeground }]}>Sign in with your Royalhouse account before opening the administration workspace.</Text><ActionButton label="Sign in" icon="log-in-outline" variant="gold" onPress={() => router.replace('/sign-in' as never)} /><ActionButton label="Close" variant="ghost" onPress={close} /></View>;
  }
  if (adminProfile.isLoading) {
    return <View style={[styles.accessState, { backgroundColor: colors.background }]}><Ionicons name="shield-checkmark-outline" size={35} color={colors.accent} /><Text style={[styles.accessTitle, { color: colors.foreground }]}>Checking admin access…</Text><Text style={[styles.accessBody, { color: colors.mutedForeground }]}>Verifying your active Royalhouse assignment.</Text></View>;
  }
  if (adminProfile.isError || !role) {
    return <View style={[styles.accessState, { backgroundColor: colors.background }]}><View style={[styles.accessIcon, { backgroundColor: '#F8F1D7' }]}><Ionicons name="shield-outline" size={27} color={colors.accent} /></View><Text style={[styles.accessTitle, { color: colors.foreground }]}>Admin access not assigned</Text><Text style={[styles.accessBody, { color: colors.mutedForeground }]}>Your account is signed in, but Headquarters has not assigned an active administration role yet.</Text><ActionButton label="Close" variant="gold" onPress={close} /></View>;
  }
  const dashboardContent = (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={[styles.scrollContent, { paddingTop: 24 }]} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
      {previewRole ? <View style={[styles.previewBanner, { backgroundColor: '#FFF6D6', borderColor: colors.accent }]}><View style={styles.previewBannerCopy}><Text style={[styles.previewBannerLabel, { color: colors.accent }]}>PREVIEW MODE</Text><Text style={[styles.previewBannerRole, { color: colors.foreground }]}>Viewing as {previewRole}</Text></View><Pressable onPress={() => { setPreviewRole(null); setActiveModule('Overview'); }} style={[styles.exitPreviewButton, { backgroundColor: colors.primary }]}><Text style={styles.exitPreviewText}>EXIT PREVIEW</Text></Pressable></View> : null}
       <View style={styles.adminHeader}>
         <View style={styles.adminHeaderCopy}><Text style={[styles.eyebrow, { color: colors.accent }]}>{previewRole ? `${previewRole.toUpperCase()} PREVIEW` : 'ROYALHOUSE CMS'}</Text><Text style={[styles.adminTitle, { color: colors.foreground }]}>{previewRole ? `${previewRole} view` : 'Command center'}</Text><Text style={[styles.adminSubtitle, { color: colors.mutedForeground }]}>{previewRole ? 'Navigation and API access are limited to this role.' : 'Manage the digital kingdom with clarity.'}</Text></View>
        <Pressable onPress={close} style={styles.adminClose}><Ionicons name="close" size={20} color={colors.foreground} /></Pressable>
      </View>
      <Pressable disabled={role !== 'Super Admin'} onPress={() => setShowPreviewPicker(true)} style={[styles.roleSelector, { backgroundColor: colors.primary }, role !== 'Super Admin' && { opacity: 0.9 }]}>
        <View style={styles.roleSelectorIcon}><Ionicons name="shield-checkmark" size={17} color={colors.accent} /></View>
        <View style={styles.roleSelectorCopy}><Text style={styles.roleSelectorLabel}>{previewRole ? 'PREVIEWING AS' : 'VIEWING AS'}</Text><Text style={styles.roleSelectorValue}>{effectiveRole}</Text></View>
        <Ionicons name={role === 'Super Admin' ? 'chevron-down' : 'checkmark-circle'} size={18} color={colors.accent} />
      </Pressable>

      {!previewRole ? <View style={styles.adminStatsGrid}>
        <AdminStat label="People in Connect" value={connectSummary.data ? String(connectSummary.data.peopleCount) : '—'} trend={connectSummary.data ? `${connectSummary.data.pendingFollowUps} follow-ups` : 'Loading'} icon="people-outline" />
        <AdminStat label="Branches" value={String(activeBranches.length)} trend="+2 this year" icon="location-outline" />
        <AdminStat label="Countries" value={String(new Set(activeBranches.map((branch) => branch.country)).size).padStart(2, '0')} trend="From directory" icon="globe-outline" />
        <AdminStat label="Giving this month" value="—" trend="Finance module" icon="trending-up-outline" />
      </View> : null}

      <SectionHeader title={activeModule === 'Overview' ? 'Workspace modules' : copy?.title ?? ''} action={activeModule !== 'Overview' ? 'Overview' : undefined} onPress={() => setActiveModule('Overview')} />
      {activeModule === 'Overview' ? (
        <>
          {permittedModules.length > 0 ? <View style={styles.moduleGrid}>{permittedModules.map((module) => <Pressable key={module} onPress={() => setActiveModule(module)} style={({ pressed }) => [styles.moduleCard, { backgroundColor: colors.card, borderColor: colors.border }, pressed && styles.pressed]}><View style={[styles.moduleIcon, { backgroundColor: '#F8F1D7' }]}><Ionicons name={moduleIcons[module]} size={20} color={colors.accent} /></View><Text style={[styles.moduleName, { color: colors.foreground }]}>{module}</Text><Ionicons name="arrow-forward" size={14} color={colors.mutedForeground} /></Pressable>)}</View> : <View style={[styles.moduleEmpty, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name={previewRole === 'Visitor' ? 'walk-outline' : 'person-outline'} size={28} color={colors.accent} /><Text style={[styles.moduleEmptyTitle, { color: colors.foreground }]}>{previewRole === 'Visitor' ? 'Visitor-facing view' : 'Member-facing view'}</Text><Text style={[styles.moduleEmptyBody, { color: colors.mutedForeground }]}>This preview contains no administration modules. Exit preview to return to the Super Admin command center.</Text></View>}
          {!previewRole ? <><SectionHeader title="Recent activity" action="View audit log" onPress={() => permittedModules.includes('Audit Logs') ? setActiveModule('Audit Logs') : Alert.alert('Permission required', 'Your current role cannot view audit logs.')} />
          <View style={[styles.activityCard, { backgroundColor: colors.card, borderColor: colors.border }]}><AdminActivity icon="location-outline" title="Branch directory updated" detail="International Headquarters profile reviewed" time="12 min ago" /><AdminActivity icon="heart-outline" title="New giving received" detail="$250 · Building project" time="1 hr ago" /><AdminActivity icon="calendar-outline" title="Event registration opened" detail="Global Worship Service" time="3 hrs ago" /><AdminActivity icon="person-add-outline" title="New member registration" detail="Victory Center · United States" time="Yesterday" /></View></> : null}
        </>
      ) : (
        <>
           {activeModule === 'Connect Team' ? <ConnectTeamWorkspace /> : <><View style={[styles.workspaceIntro, { backgroundColor: colors.card, borderColor: colors.border }]}><Text style={[styles.workspaceBody, { color: colors.mutedForeground }]}>{copy?.body}</Text><View style={styles.workspaceActions}><ActionButton label={copy?.primary ?? 'Open'} icon="add-circle-outline" variant="gold" onPress={() => actionFeedback(copy?.primary ?? 'Open')} /><ActionButton label={copy?.secondary ?? 'View'} icon="arrow-forward-outline" variant="outline" onPress={() => actionFeedback(copy?.secondary ?? 'View')} /></View></View>{activeModule === 'Branches' ? <View style={styles.adminBranchList}>{activeBranches.map((branch) => <View key={branch.name} style={[styles.adminBranchRow, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={[styles.branchListIcon, { backgroundColor: colors.primary }]}><Image source={logo} style={styles.branchListLogo} resizeMode="contain" /></View><View style={styles.branchListCopy}><Text style={[styles.branchListName, { color: colors.foreground }]}>{branch.name}</Text><Text style={[styles.branchListMeta, { color: colors.mutedForeground }]}>{branch.city}, {branch.country}</Text></View><Pressable onPress={() => openEditBranch(branch)} hitSlop={12}><Ionicons name="create-outline" size={19} color={colors.accent} /></Pressable><Pressable onPress={() => archiveBranch(branch)} hitSlop={12}><Ionicons name="archive-outline" size={19} color={colors.destructive} /></Pressable></View>)}</View> : <View style={[styles.moduleEmpty, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name={moduleIcons[activeModule]} size={28} color={colors.accent} /><Text style={[styles.moduleEmptyTitle, { color: colors.foreground }]}>Ready for {role}</Text><Text style={[styles.moduleEmptyBody, { color: colors.mutedForeground }]}>Use the actions above to begin managing this module.</Text></View>}</>}
        </>
      )}
      <View style={styles.bottomSpacer} />
    </ScrollView>
  );
  const branchFormModal = <Modal animationType="slide" transparent visible={showBranchForm} onRequestClose={() => setShowBranchForm(false)}><View style={styles.formBackdrop}><View style={[styles.formSheet, { backgroundColor: colors.card }]}><View style={styles.formHeader}><View><Text style={[styles.eyebrow, { color: colors.accent }]}>BRANCH MANAGEMENT</Text><Text style={[styles.formTitle, { color: colors.foreground }]}>{editingBranch ? 'Edit branch' : 'Add branch'}</Text></View><Pressable onPress={() => setShowBranchForm(false)} hitSlop={12}><Ionicons name="close" size={22} color={colors.foreground} /></Pressable></View>{(['name', 'city', 'region', 'address'] as const).map((field) => <View key={field}><Text style={[styles.formLabel, { color: colors.foreground }]}>{field === 'name' ? 'Branch name' : field.charAt(0).toUpperCase() + field.slice(1)}</Text><TextInput value={branchForm[field]} onChangeText={(value) => setBranchForm((current) => ({ ...current, [field]: value }))} placeholder={field === 'name' ? 'e.g. Royalhouse Chapel Virginia' : `Enter ${field}`} placeholderTextColor={colors.mutedForeground} style={[styles.formInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /></View>)}<Text style={[styles.formLabel, { color: colors.foreground }]}>Country</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.formCountryRow}>{['United States', 'Ghana', 'Canada'].map((item) => <Pressable key={item} onPress={() => setBranchForm((current) => ({ ...current, country: item }))} style={[styles.formCountry, { backgroundColor: branchForm.country === item ? colors.accent : colors.background, borderColor: branchForm.country === item ? colors.accent : colors.border }]}><Text style={[styles.formCountryText, { color: branchForm.country === item ? '#FFFFFF' : colors.foreground }]}>{item}</Text></Pressable>)}</ScrollView><ActionButton label={editingBranch ? 'Save branch changes' : 'Add branch to directory'} icon="checkmark-circle-outline" variant="gold" full onPress={saveBranch} /></View></View></Modal>;
  const previewPickerModal = <Modal animationType="slide" transparent visible={showPreviewPicker} onRequestClose={() => setShowPreviewPicker(false)}><View style={styles.formBackdrop}><View style={[styles.previewSheet, { backgroundColor: colors.card }]}><View style={styles.formHeader}><View><Text style={[styles.eyebrow, { color: colors.accent }]}>SUPER ADMIN TOOL</Text><Text style={[styles.formTitle, { color: colors.foreground }]}>View As</Text></View><Pressable onPress={() => setShowPreviewPicker(false)} hitSlop={12}><Ionicons name="close" size={22} color={colors.foreground} /></Pressable></View><TextInput value={previewSearch} onChangeText={setPreviewSearch} placeholder="Search departments or roles" placeholderTextColor={colors.mutedForeground} style={[styles.formInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} />{Array.from(new Set(visiblePreviewRoles.map((option) => option.department))).map((department) => <View key={department}><Text style={[styles.previewDepartment, { color: colors.accent }]}>{department}</Text>{visiblePreviewRoles.filter((option) => option.department === department).map((option) => <Pressable key={option.role} onPress={() => { setPreviewRole(option.role === role ? null : option.role); setShowPreviewPicker(false); setPreviewSearch(''); setActiveModule('Overview'); }} style={[styles.previewOption, { borderBottomColor: colors.border }]}><View style={styles.previewOptionCopy}><Ionicons name={option.icon} size={18} color={colors.accent} /><Text style={[styles.roleOptionText, { color: colors.foreground }]}>{option.role}</Text></View>{effectiveRole === option.role ? <Ionicons name="checkmark-circle" size={19} color={colors.accent} /> : null}</Pressable>)}</View>)}<Text style={[styles.previewHint, { color: colors.mutedForeground }]}>Preview mode never changes the signed-in user’s permanent role.</Text></View></View></Modal>;
  return standalone ? <>{dashboardContent}{branchFormModal}{previewPickerModal}</> : <Modal animationType="slide" visible onRequestClose={close}><>{dashboardContent}{branchFormModal}{previewPickerModal}</></Modal>;
}

function AdminStat({ label, value, trend, icon }: { label: string; value: string; trend: string; icon: IconName }) {
  const colors = useColors();
  return <View style={[styles.adminStat, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={styles.adminStatTop}><Ionicons name={icon} size={17} color={colors.accent} /><Text style={[styles.adminStatTrend, { color: colors.accent }]}>{trend}</Text></View><Text style={[styles.adminStatValue, { color: colors.foreground }]}>{value}</Text><Text style={[styles.adminStatLabel, { color: colors.mutedForeground }]}>{label}</Text></View>;
}

function AdminActivity({ icon, title, detail, time }: { icon: IconName; title: string; detail: string; time: string }) {
  const colors = useColors();
  return <View style={[styles.activityRow, { borderBottomColor: colors.border }]}><View style={[styles.activityIcon, { backgroundColor: '#F8F1D7' }]}><Ionicons name={icon} size={16} color={colors.accent} /></View><View style={styles.activityCopy}><Text style={[styles.activityTitle, { color: colors.foreground }]}>{title}</Text><Text style={[styles.activityDetail, { color: colors.mutedForeground }]}>{detail}</Text></View><Text style={[styles.activityTime, { color: colors.mutedForeground }]}>{time}</Text></View>;
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
  return <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.scrollContent}><View style={[styles.profileHero, { backgroundColor: colors.primary }]}><View style={[styles.profileAvatar, { backgroundColor: colors.accent }]}><Text style={styles.profileAvatarText}>C</Text></View><Text style={styles.profileName}>Clement Bolarinwa</Text><Text style={styles.profileBranch}>Royalhouse Victory Center · Member</Text><View style={styles.memberBadge}><Ionicons name="shield-checkmark" size={14} color={colors.accent} /><Text style={[styles.memberBadgeText, { color: colors.accent }]}>MEMBER SINCE 2024</Text></View></View><SectionHeader title="Your kingdom journey" /><View style={styles.profileGrid}><ProfileStat value="12" label="Saved sermons" icon="bookmark-outline" /><ProfileStat value="04" label="Events joined" icon="calendar-outline" /><ProfileStat value="08" label="Prayer updates" icon="heart-outline" /><ProfileStat value="$450" label="This year giving" icon="gift-outline" /></View><SectionHeader title="Quick access" /><ProfileMenu label="Digital member ID" detail="Your membership card" icon="card-outline" onPress={() => Alert.alert('Digital member ID', 'Your member ID will be available here once your profile is verified.')} /><ProfileMenu label="Giving history" detail="View gifts and receipts" icon="receipt-outline" onPress={() => navigate('give')} /><ProfileMenu label="Saved resources" detail="Sermons and library items" icon="library-outline" onPress={() => navigate('sermons')} /><ProfileMenu label="Find a branch" detail="Explore the global directory" icon="location-outline" onPress={() => navigate('branches')} /><ProfileMenu label="Admin Dashboard" detail="Manage the Royalhouse ecosystem" icon="speedometer-outline" onPress={() => navigate('admin')} /><ProfileMenu label="Notification settings" detail="Stay connected to the house" icon="notifications-outline" onPress={() => Alert.alert('Notifications', 'Notification preferences are ready to configure.')} /><View style={styles.bottomSpacer} /></ScrollView>;
}

function ConnectTeamWorkspace() {
  const colors = useColors();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [showCallForm, setShowCallForm] = useState(false);
  const [personForm, setPersonForm] = useState({ fullName: '', phone: '', email: '', personType: 'visitor', notes: '' });
  const [callForm, setCallForm] = useState({
    outcomeCode: '',
    situationCodes: [] as string[],
    notes: '',
    nextFollowUpAt: '',
    prayerNeeded: false,
    pastoralAttention: false,
    visitationRequested: false,
    foundationSchoolInterest: false,
  });
  const peopleQuery = useListConnectPeople(search.trim() ? { search: search.trim() } : undefined);
  const summaryQuery = useGetConnectSummary({ query: { queryKey: getGetConnectSummaryQueryKey() } });
  const optionsQuery = useListConnectWorkflowOptions();
  const profileQuery = useGetConnectPersonProfile(selectedPersonId ?? '', {
    query: { queryKey: selectedPersonId ? getGetConnectPersonProfileQueryKey(selectedPersonId) : [], enabled: Boolean(selectedPersonId) },
  });
  const createPersonMutation = useCreateConnectPerson();
  const logInteractionMutation = useLogConnectInteraction();
  const completeFollowUpMutation = useCompleteConnectFollowUp();
  const people = peopleQuery.data ?? [];
  const summary = summaryQuery.data;
  const options = optionsQuery.data ?? [];
  const outcomes = options.filter((option) => option.category === 'call_outcome');
  const situations = options.filter((option) => option.category === 'situation');
  const selectedPerson = profileQuery.data?.person ?? people.find((person) => person.id === selectedPersonId);
  const invalidateConnect = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: getListConnectPeopleQueryKey() }),
      queryClient.invalidateQueries({ queryKey: getGetConnectSummaryQueryKey() }),
      ...(selectedPersonId ? [queryClient.invalidateQueries({ queryKey: getGetConnectPersonProfileQueryKey(selectedPersonId) })] : []),
    ]);
  };
  const savePerson = async () => {
    if (!personForm.fullName.trim()) {
      Alert.alert('Name required', 'Add the person’s name before saving.');
      return;
    }
    try {
      const created = await createPersonMutation.mutateAsync({
        data: {
          fullName: personForm.fullName.trim(),
          personType: personForm.personType,
          phone: personForm.phone.trim() || undefined,
          email: personForm.email.trim() || undefined,
          notes: personForm.notes.trim() || undefined,
          tags: [],
        },
      });
      await invalidateConnect();
      setShowPersonForm(false);
      setPersonForm({ fullName: '', phone: '', email: '', personType: 'visitor', notes: '' });
      setSelectedPersonId(created.id);
      Alert.alert('Person added', 'The record is ready for Connect Team assignment and follow-up.');
    } catch (error) {
      Alert.alert('Could not add person', error instanceof Error ? error.message : 'Please try again.');
    }
  };
  const toggleSituation = (code: string) => {
    setCallForm((current) => ({
      ...current,
      situationCodes: current.situationCodes.includes(code)
        ? current.situationCodes.filter((item) => item !== code)
        : [...current.situationCodes, code],
    }));
  };
  const logCall = async () => {
    if (!selectedPersonId || !callForm.outcomeCode) {
      Alert.alert('Choose an outcome', 'Select what happened on the call before saving.');
      return;
    }
    try {
      await logInteractionMutation.mutateAsync({
        id: selectedPersonId,
        data: {
          interactionType: 'call',
          outcomeCode: callForm.outcomeCode,
          situationCodes: callForm.situationCodes,
          prayerNeeded: callForm.prayerNeeded,
          pastoralAttention: callForm.pastoralAttention,
          visitationRequested: callForm.visitationRequested,
          foundationSchoolInterest: callForm.foundationSchoolInterest,
          notes: callForm.notes.trim() || undefined,
          nextFollowUpAt: callForm.nextFollowUpAt.trim() || undefined,
        },
      });
      await invalidateConnect();
      setShowCallForm(false);
      setCallForm({ outcomeCode: '', situationCodes: [], notes: '', nextFollowUpAt: '', prayerNeeded: false, pastoralAttention: false, visitationRequested: false, foundationSchoolInterest: false });
      Alert.alert('Call logged', 'The interaction and any triggered follow-ups were saved.');
    } catch (error) {
      Alert.alert('Could not log call', error instanceof Error ? error.message : 'Please try again.');
    }
  };
  const completeFollowUp = async (followUpId: string) => {
    try {
      await completeFollowUpMutation.mutateAsync({ id: followUpId });
      await invalidateConnect();
    } catch (error) {
      Alert.alert('Could not complete follow-up', error instanceof Error ? error.message : 'Please try again.');
    }
  };
  const statItems = [
    { label: 'People', value: summary?.peopleCount ?? 0, icon: 'people-outline' as IconName },
    { label: 'Assigned', value: summary?.assignedCount ?? 0, icon: 'person-add-outline' as IconName },
    { label: 'Follow-ups', value: summary?.pendingFollowUps ?? 0, icon: 'calendar-outline' as IconName },
    { label: 'Pastoral', value: summary?.pastoralAttentionCount ?? 0, icon: 'heart-outline' as IconName },
  ];
  return (
    <>
      <View style={[styles.connectIntro, { backgroundColor: colors.primary }]}>
        <View style={styles.connectIntroCopy}><Text style={styles.roleSelectorLabel}>CONNECT TEAM WORKSPACE</Text><Text style={styles.connectTitle}>People before programs.</Text><Text style={styles.connectSubtitle}>Capture every visitor, call, care need, and next action in one shared record.</Text></View>
        <View style={styles.connectIntroIcon}><Ionicons name="call-outline" size={23} color={colors.accent} /></View>
      </View>
      <View style={styles.connectStatsGrid}>{statItems.map((item) => <View key={item.label} style={[styles.connectStat, { backgroundColor: colors.card, borderColor: colors.border }]}><Ionicons name={item.icon} size={17} color={colors.accent} /><Text style={[styles.connectStatValue, { color: colors.foreground }]}>{item.value}</Text><Text style={[styles.connectStatLabel, { color: colors.mutedForeground }]}>{item.label}</Text></View>)}</View>
      <View style={[styles.connectToolbar, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.connectSearch, { backgroundColor: colors.background, borderColor: colors.border }]}><Ionicons name="search-outline" size={17} color={colors.mutedForeground} /><TextInput value={search} onChangeText={setSearch} placeholder="Search name, phone, email, ID" placeholderTextColor={colors.mutedForeground} style={[styles.connectSearchInput, { color: colors.foreground }]} /></View>
        <ActionButton label="Add person" icon="person-add-outline" variant="gold" onPress={() => setShowPersonForm(true)} />
      </View>
      {peopleQuery.isLoading ? <View style={styles.connectLoading}><Ionicons name="sync-outline" size={22} color={colors.accent} /><Text style={[styles.connectLoadingText, { color: colors.mutedForeground }]}>Loading assigned people…</Text></View> : null}
      {!peopleQuery.isLoading && people.length === 0 ? <EmptyState icon="people-outline" title="No people in this view" body="Add a visitor or ask a Connect Team leader to assign people to your workload." /> : null}
      {people.map((person) => <Pressable key={person.id} onPress={() => setSelectedPersonId(person.id)} style={({ pressed }) => [styles.connectPersonRow, { backgroundColor: colors.card, borderColor: selectedPersonId === person.id ? colors.accent : colors.border }, pressed && styles.pressed]}><View style={[styles.connectAvatar, { backgroundColor: colors.primary }]}><Text style={styles.connectAvatarText}>{person.fullName.slice(0, 1).toUpperCase()}</Text></View><View style={styles.connectPersonCopy}><Text style={[styles.connectPersonName, { color: colors.foreground }]}>{person.fullName}</Text><Text style={[styles.connectPersonMeta, { color: colors.mutedForeground }]}>{person.personType} · {person.phone || person.email || 'Contact details pending'}</Text><Text style={[styles.connectPersonMeta, { color: person.pastoralFollowUp ? colors.destructive : colors.mutedForeground }]}>{person.pastoralFollowUp ? 'Pastoral follow-up flagged' : person.membershipStatus === 'member' ? 'Member' : 'Needs connection'}</Text></View><Ionicons name="chevron-forward" size={18} color={colors.mutedForeground} /></Pressable>)}
      {selectedPerson ? <View style={[styles.connectProfileCard, { backgroundColor: colors.card, borderColor: colors.border }]}><View style={styles.connectProfileHeader}><View style={styles.connectPersonCopy}><Text style={[styles.eyebrow, { color: colors.accent }]}>PERSON PROFILE</Text><Text style={[styles.connectProfileName, { color: colors.foreground }]}>{selectedPerson.fullName}</Text><Text style={[styles.connectPersonMeta, { color: colors.mutedForeground }]}>{selectedPerson.phone || selectedPerson.email || 'No contact details yet'}</Text></View><Pressable onPress={() => setSelectedPersonId(null)} hitSlop={12}><Ionicons name="close-circle-outline" size={23} color={colors.mutedForeground} /></Pressable></View><View style={styles.connectActionRow}><ActionButton label="Log call" icon="call-outline" variant="gold" onPress={() => setShowCallForm(true)} /><ActionButton label="Refresh" icon="refresh-outline" variant="outline" onPress={() => profileQuery.refetch()} /></View>{selectedPerson.notes ? <Text style={[styles.connectNotes, { color: colors.mutedForeground }]}>{selectedPerson.notes}</Text> : null}{profileQuery.data?.followUps.filter((item) => item.status === 'pending').map((followUp) => <View key={followUp.id} style={[styles.connectFollowUp, { borderColor: colors.border }]}><View style={styles.connectPersonCopy}><Text style={[styles.connectFollowUpType, { color: colors.foreground }]}>{followUp.followUpType.replaceAll('_', ' ')}</Text><Text style={[styles.connectPersonMeta, { color: colors.mutedForeground }]}>Due {new Date(followUp.dueAt).toLocaleDateString()}</Text></View><Pressable onPress={() => completeFollowUp(followUp.id)} style={[styles.connectCompleteButton, { backgroundColor: '#E7F5EC' }]}><Ionicons name="checkmark" size={16} color="#2B8A4B" /><Text style={styles.connectCompleteText}>Done</Text></Pressable></View>)}{profileQuery.data?.interactions.slice(0, 3).map((interaction) => <View key={interaction.id} style={[styles.connectInteraction, { borderTopColor: colors.border }]}><Text style={[styles.connectFollowUpType, { color: colors.foreground }]}>{interaction.outcomeCode.replaceAll('_', ' ')}</Text><Text style={[styles.connectPersonMeta, { color: colors.mutedForeground }]}>{new Date(interaction.createdAt).toLocaleDateString()} · {interaction.notes || 'No notes recorded'}</Text></View>)}</View> : null}
      <Modal animationType="slide" transparent visible={showPersonForm} onRequestClose={() => setShowPersonForm(false)}><View style={styles.formBackdrop}><View style={[styles.formSheet, { backgroundColor: colors.card }]}><View style={styles.formHeader}><View><Text style={[styles.eyebrow, { color: colors.accent }]}>CONNECT TEAM</Text><Text style={[styles.formTitle, { color: colors.foreground }]}>Add person</Text></View><Pressable onPress={() => setShowPersonForm(false)} hitSlop={12}><Ionicons name="close" size={22} color={colors.foreground} /></Pressable></View>{([['fullName', 'Full name', 'e.g. Ama Mensah'], ['phone', 'Phone', 'Optional phone number'], ['email', 'Email', 'Optional email address']] as const).map(([field, label, placeholder]) => <View key={field}><Text style={[styles.formLabel, { color: colors.foreground }]}>{label}</Text><TextInput value={personForm[field]} onChangeText={(value) => setPersonForm((current) => ({ ...current, [field]: value }))} placeholder={placeholder} placeholderTextColor={colors.mutedForeground} style={[styles.formInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /></View>)}<Text style={[styles.formLabel, { color: colors.foreground }]}>Person type</Text><View style={styles.formCountryRow}>{['visitor', 'member'].map((type) => <Pressable key={type} onPress={() => setPersonForm((current) => ({ ...current, personType: type }))} style={[styles.formCountry, { backgroundColor: personForm.personType === type ? colors.accent : colors.background, borderColor: personForm.personType === type ? colors.accent : colors.border }]}><Text style={[styles.formCountryText, { color: personForm.personType === type ? '#FFFFFF' : colors.foreground }]}>{type}</Text></Pressable>)}</View><Text style={[styles.formLabel, { color: colors.foreground }]}>Notes</Text><TextInput value={personForm.notes} onChangeText={(value) => setPersonForm((current) => ({ ...current, notes: value }))} multiline placeholder="Context the Connect Team should know" placeholderTextColor={colors.mutedForeground} style={[styles.formInput, styles.formTextArea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /><ActionButton label="Save person" icon="checkmark-circle-outline" variant="gold" full onPress={savePerson} /></View></View></Modal>
      <Modal animationType="slide" transparent visible={showCallForm} onRequestClose={() => setShowCallForm(false)}><View style={styles.formBackdrop}><ScrollView style={[styles.formSheet, { backgroundColor: colors.card }]} contentContainerStyle={{ paddingBottom: 28 }}><View style={styles.formHeader}><View><Text style={[styles.eyebrow, { color: colors.accent }]}>STRUCTURED CALL LOG</Text><Text style={[styles.formTitle, { color: colors.foreground }]}>What happened?</Text></View><Pressable onPress={() => setShowCallForm(false)} hitSlop={12}><Ionicons name="close" size={22} color={colors.foreground} /></Pressable></View><Text style={[styles.formLabel, { color: colors.foreground }]}>Call outcome</Text><View style={styles.formChoiceWrap}>{outcomes.map((option) => <Pressable key={option.code} onPress={() => setCallForm((current) => ({ ...current, outcomeCode: option.code }))} style={[styles.formChoice, { backgroundColor: callForm.outcomeCode === option.code ? colors.accent : colors.background, borderColor: callForm.outcomeCode === option.code ? colors.accent : colors.border }]}><Text style={[styles.formChoiceText, { color: callForm.outcomeCode === option.code ? '#FFFFFF' : colors.foreground }]}>{option.label}</Text></Pressable>)}</View><Text style={[styles.formLabel, { color: colors.foreground }]}>Care flags</Text><View style={styles.formChoiceWrap}>{situations.map((option) => <Pressable key={option.code} onPress={() => toggleSituation(option.code)} style={[styles.formChoice, { backgroundColor: callForm.situationCodes.includes(option.code) ? '#F8F1D7' : colors.background, borderColor: callForm.situationCodes.includes(option.code) ? colors.accent : colors.border }]}><Text style={[styles.formChoiceText, { color: colors.foreground }]}>{option.label}</Text></Pressable>)}</View><View style={styles.checkboxStack}>{([['prayerNeeded', 'Prayer requested'], ['pastoralAttention', 'Pastoral attention'], ['visitationRequested', 'Visitation requested'], ['foundationSchoolInterest', 'Foundation School interest']] as const).map(([field, label]) => <Pressable key={field} onPress={() => setCallForm((current) => ({ ...current, [field]: !current[field] }))} style={styles.checkboxRow}><View style={[styles.checkbox, { borderColor: callForm[field] ? colors.accent : colors.border, backgroundColor: callForm[field] ? colors.accent : colors.card }]}>{callForm[field] ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}</View><Text style={[styles.checkboxTitle, { color: colors.foreground }]}>{label}</Text></Pressable>)}</View><Text style={[styles.formLabel, { color: colors.foreground }]}>Next follow-up date</Text><TextInput value={callForm.nextFollowUpAt} onChangeText={(value) => setCallForm((current) => ({ ...current, nextFollowUpAt: value }))} placeholder="2026-09-14T10:00:00Z" placeholderTextColor={colors.mutedForeground} style={[styles.formInput, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /><Text style={[styles.formLabel, { color: colors.foreground }]}>Notes</Text><TextInput value={callForm.notes} onChangeText={(value) => setCallForm((current) => ({ ...current, notes: value }))} multiline placeholder="Record what the person shared and the next action" placeholderTextColor={colors.mutedForeground} style={[styles.formInput, styles.formTextArea, { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background }]} /><ActionButton label="Save call and create follow-ups" icon="checkmark-circle-outline" variant="gold" full onPress={logCall} /></ScrollView></View></Modal>
    </>
  );
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
  if (screen === 'branches') return <BranchesScreen close={() => setScreen('home')} />;
  if (screen === 'admin') return <AdminDashboardScreen close={() => setScreen('home')} />;
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
  heroOverlay: { ...StyleSheet.absoluteFill, backgroundColor: 'rgba(9, 18, 49, 0.63)' },
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
  mapPanel: { marginHorizontal: 16, marginTop: 17, height: 202, borderRadius: 17, overflow: 'hidden', position: 'relative' },
  mapGridLineHorizontalOne: { position: 'absolute', top: 62, left: -10, right: -10, height: 1, backgroundColor: 'rgba(255,255,255,0.08)', transform: [{ rotate: '-4deg' }] },
  mapGridLineHorizontalTwo: { position: 'absolute', top: 137, left: -10, right: -10, height: 1, backgroundColor: 'rgba(255,255,255,0.08)', transform: [{ rotate: '4deg' }] },
  mapGridLineVerticalOne: { position: 'absolute', left: 120, top: -10, bottom: -10, width: 1, backgroundColor: 'rgba(255,255,255,0.08)', transform: [{ rotate: '13deg' }] },
  mapGridLineVerticalTwo: { position: 'absolute', left: 260, top: -10, bottom: -10, width: 1, backgroundColor: 'rgba(255,255,255,0.08)', transform: [{ rotate: '-14deg' }] },
  mapLandOne: { position: 'absolute', left: 26, top: 57, width: 114, height: 55, borderRadius: 45, backgroundColor: 'rgba(255,255,255,0.06)', transform: [{ rotate: '-22deg' }] },
  mapLandTwo: { position: 'absolute', right: 29, top: 78, width: 74, height: 65, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.06)', transform: [{ rotate: '24deg' }] },
  mapLabel: { position: 'absolute', top: 15, left: 17, color: '#D9C56D', fontSize: 9, fontWeight: '800', letterSpacing: 1.5 },
  mapPin: { position: 'absolute', width: 27, height: 27, alignItems: 'center', justifyContent: 'center' },
  mapPinDot: { width: 11, height: 11, borderRadius: 6, borderWidth: 2, shadowColor: '#D9C56D', shadowOpacity: 0.7, shadowRadius: 5, elevation: 4 },
  mapLegend: { position: 'absolute', left: 17, bottom: 14, flexDirection: 'row', alignItems: 'center', gap: 7 },
  mapLegendText: { color: '#DDE4F3', fontSize: 10 },
  branchDetailCard: { marginHorizontal: 16, marginTop: 14, borderWidth: 1, borderRadius: 15, padding: 14 },
  branchDetailHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  branchLogoSmall: { width: 44, height: 44, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  branchLogoImage: { width: 38, height: 38 },
  branchDetailTitleCopy: { flex: 1 },
  branchDetailName: { fontSize: 14, lineHeight: 19, fontWeight: '700' },
  branchDetailRegion: { fontSize: 11, fontWeight: '700', marginTop: 3 },
  branchInfoLine: { flexDirection: 'row', gap: 9, alignItems: 'flex-start', paddingTop: 11, marginTop: 11, borderTopWidth: 1 },
  branchInfoText: { flex: 1, fontSize: 12, lineHeight: 17 },
  branchActionRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  branchAction: { flex: 1, borderRadius: 9, minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  branchActionText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  pendingLabel: { fontSize: 10, lineHeight: 15, marginTop: 12 },
  branchListRow: { marginHorizontal: 16, marginBottom: 9, borderRadius: 13, borderWidth: 1, padding: 11, flexDirection: 'row', alignItems: 'center', gap: 10 },
  branchListIcon: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  branchListLogo: { width: 42, height: 42 },
  branchListCopy: { flex: 1 },
  branchListName: { fontSize: 13, fontWeight: '700', lineHeight: 17 },
  branchListMeta: { fontSize: 11, marginTop: 3 },
  branchListAddress: { fontSize: 10, marginTop: 3 },
  directoryNote: { marginHorizontal: 16, marginTop: 9, padding: 13, borderRadius: 11, flexDirection: 'row', gap: 9, alignItems: 'flex-start' },
  directoryNoteText: { flex: 1, fontSize: 11, lineHeight: 16 },
  adminHeader: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 16, flexDirection: 'row', alignItems: 'flex-start' },
  adminHeaderCopy: { flex: 1 },
  accessState: { flex: 1, minHeight: 520, padding: 28, alignItems: 'center', justifyContent: 'center' },
  accessIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  accessTitle: { fontSize: 22, lineHeight: 28, fontWeight: '700', textAlign: 'center', marginTop: 12 },
  accessBody: { maxWidth: 320, fontSize: 13, lineHeight: 20, textAlign: 'center', marginTop: 9, marginBottom: 20 },
  adminTitle: { fontSize: 28, lineHeight: 34, fontWeight: '700', marginTop: 6 },
  adminSubtitle: { fontSize: 12, marginTop: 5 },
  adminClose: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#EDEFF5', alignItems: 'center', justifyContent: 'center' },
  roleSelector: { marginHorizontal: 16, padding: 12, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  roleSelectorIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  roleSelectorCopy: { flex: 1 },
  roleSelectorLabel: { color: '#D9C56D', fontSize: 9, fontWeight: '800', letterSpacing: 1.3 },
  roleSelectorValue: { color: '#FFFFFF', fontSize: 14, fontWeight: '700', marginTop: 2 },
  previewBanner: { marginHorizontal: 16, marginBottom: 12, padding: 12, borderWidth: 1, borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  previewBannerCopy: { flex: 1 },
  previewBannerLabel: { fontSize: 9, fontWeight: '800', letterSpacing: 1.2 },
  previewBannerRole: { fontSize: 12, fontWeight: '700', marginTop: 3 },
  exitPreviewButton: { minHeight: 36, borderRadius: 9, paddingHorizontal: 11, alignItems: 'center', justifyContent: 'center' },
  exitPreviewText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.6 },
  previewSheet: { paddingTop: 20, paddingBottom: 22, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '90%' },
  previewDepartment: { paddingHorizontal: 20, paddingTop: 13, paddingBottom: 5, fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  previewOption: { minHeight: 46, marginHorizontal: 16, paddingHorizontal: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: StyleSheet.hairlineWidth },
  previewOptionCopy: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  previewHint: { marginTop: 14, marginHorizontal: 20, fontSize: 10, lineHeight: 15, textAlign: 'center' },
  roleMenu: { marginHorizontal: 16, marginTop: 7, borderRadius: 13, borderWidth: 1, overflow: 'hidden' },
  roleOption: { minHeight: 42, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1 },
  roleOptionText: { fontSize: 12, fontWeight: '600' },
  adminStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, marginTop: 16 },
  adminStat: { width: '48%', minHeight: 104, padding: 12, borderWidth: 1, borderRadius: 13 },
  adminStatTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  adminStatTrend: { fontSize: 9, fontWeight: '700' },
  adminStatValue: { fontSize: 22, fontWeight: '700', marginTop: 15 },
  adminStatLabel: { fontSize: 10, marginTop: 3 },
  moduleGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8 },
  moduleCard: { width: '48%', minHeight: 106, padding: 12, borderWidth: 1, borderRadius: 13, justifyContent: 'space-between' },
  moduleIcon: { width: 35, height: 35, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  moduleName: { fontSize: 12, lineHeight: 16, fontWeight: '700', marginTop: 8, flex: 1 },
  activityCard: { marginHorizontal: 16, paddingHorizontal: 12, borderWidth: 1, borderRadius: 14 },
  activityRow: { minHeight: 65, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 9, borderBottomWidth: 1 },
  activityRowLast: { borderBottomWidth: 0 },
  activityIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  activityCopy: { flex: 1 },
  activityTitle: { fontSize: 12, fontWeight: '700' },
  activityDetail: { fontSize: 10, marginTop: 3 },
  activityTime: { fontSize: 9 },
  workspaceIntro: { marginHorizontal: 16, padding: 15, borderWidth: 1, borderRadius: 14 },
  workspaceBody: { fontSize: 12, lineHeight: 18 },
  workspaceActions: { flexDirection: 'row', gap: 8, marginTop: 14 },
  connectIntro: { marginHorizontal: 16, marginTop: 14, padding: 16, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 12 },
  connectIntroCopy: { flex: 1 },
  connectTitle: { color: '#FFFFFF', fontSize: 21, fontWeight: '700', marginTop: 7 },
  connectSubtitle: { color: '#DDE4F3', fontSize: 12, lineHeight: 17, marginTop: 6 },
  connectIntroIcon: { width: 46, height: 46, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  connectStatsGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 16, gap: 8, marginTop: 12 },
  connectStat: { width: '48%', minHeight: 86, padding: 11, borderWidth: 1, borderRadius: 13 },
  connectStatValue: { fontSize: 21, fontWeight: '700', marginTop: 9 },
  connectStatLabel: { fontSize: 10, marginTop: 2 },
  connectToolbar: { marginHorizontal: 16, marginTop: 14, padding: 11, borderWidth: 1, borderRadius: 14, gap: 10 },
  connectSearch: { height: 43, borderWidth: 1, borderRadius: 10, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 7 },
  connectSearchInput: { flex: 1, fontSize: 12 },
  connectLoading: { minHeight: 110, alignItems: 'center', justifyContent: 'center', gap: 8 },
  connectLoadingText: { fontSize: 12 },
  connectPersonRow: { marginHorizontal: 16, marginBottom: 9, padding: 11, borderWidth: 1, borderRadius: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  connectAvatar: { width: 42, height: 42, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  connectAvatarText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700' },
  connectPersonCopy: { flex: 1 },
  connectPersonName: { fontSize: 13, fontWeight: '700' },
  connectPersonMeta: { fontSize: 10, marginTop: 4, lineHeight: 14 },
  connectProfileCard: { marginHorizontal: 16, marginTop: 6, padding: 14, borderWidth: 1, borderRadius: 15 },
  connectProfileHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  connectProfileName: { fontSize: 21, fontWeight: '700', marginTop: 5 },
  connectActionRow: { flexDirection: 'row', gap: 8, marginTop: 14 },
  connectNotes: { fontSize: 12, lineHeight: 18, marginTop: 14, paddingTop: 12, borderTopWidth: 1 },
  connectFollowUp: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, borderTopWidth: 1 },
  connectFollowUpType: { fontSize: 12, fontWeight: '700', textTransform: 'capitalize' },
  connectCompleteButton: { minHeight: 33, paddingHorizontal: 10, borderRadius: 9, flexDirection: 'row', alignItems: 'center', gap: 4 },
  connectCompleteText: { color: '#2B8A4B', fontSize: 11, fontWeight: '700' },
  connectInteraction: { paddingVertical: 10, borderTopWidth: 1 },
  formChoiceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingHorizontal: 20 },
  formChoice: { paddingHorizontal: 11, paddingVertical: 9, borderWidth: 1, borderRadius: 10 },
  formChoiceText: { fontSize: 11, fontWeight: '600' },
  checkboxStack: { marginTop: 4, paddingHorizontal: 20 },
  adminBranchList: { marginTop: 14 },
  adminBranchRow: { marginHorizontal: 16, marginBottom: 9, padding: 10, borderWidth: 1, borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 9 },
  moduleEmpty: { marginHorizontal: 16, marginTop: 14, minHeight: 170, borderWidth: 1, borderRadius: 14, alignItems: 'center', justifyContent: 'center', padding: 24 },
  moduleEmptyTitle: { fontSize: 15, fontWeight: '700', marginTop: 10 },
  moduleEmptyBody: { fontSize: 11, textAlign: 'center', marginTop: 5 },
  formBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(10,18,42,0.42)' },
  formSheet: { paddingTop: 20, paddingBottom: 28, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: '90%' },
  formHeader: { paddingHorizontal: 20, paddingBottom: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  formTitle: { fontSize: 24, lineHeight: 30, fontWeight: '700', marginTop: 5 },
  formLabel: { marginHorizontal: 20, fontSize: 12, fontWeight: '700', marginTop: 10, marginBottom: 6 },
  formInput: { marginHorizontal: 20, minHeight: 43, borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, fontSize: 13 },
  formTextArea: { minHeight: 88, paddingTop: 12, textAlignVertical: 'top' },
  formCountryRow: { paddingHorizontal: 20, gap: 7, paddingBottom: 14 },
  formCountry: { paddingVertical: 9, paddingHorizontal: 11, borderWidth: 1, borderRadius: 9 },
  formCountryText: { fontSize: 11, fontWeight: '600' },
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