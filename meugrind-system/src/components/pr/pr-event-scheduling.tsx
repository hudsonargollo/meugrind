'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Shirt, 
  Camera,
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  Building
} from 'lucide-react';
import { PREvent, WardrobeNotes, ContactInfo } from '../../types/pr';
import { prService } from '../../lib/pr-service';

interface PREventSchedulingProps {
  className?: string;
}

export function PREventScheduling({ className }: PREventSchedulingProps) {
  const [events, setEvents] = useState<PREvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<PREvent | null>(null);
  const [activeTab, setActiveTab] = useState('event-details');
  
  const [eventForm, setEventForm] = useState({
    title: '',
    type: 'interview' as PREvent['type'],
    date: '',
    time: '',
    location: '',
    duration: 60,
    expectedReach: '',
    mediaOutlets: '',
    talkingPoints: '',
  });

  const [contactForm, setContactForm] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    company: '',
  });

  const [wardrobeForm, setWardrobeForm] = useState({
    outfit: '',
    colors: '',
    style: '',
    accessories: '',
    makeup: '',
    hair: '',
    notes: '',
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const eventsData = await prService.getAllPREvents();
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading PR events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const eventDateTime = new Date(`${eventForm.date}T${eventForm.time}`);
      
      const contactInfo: ContactInfo = {
        name: contactForm.name,
        role: contactForm.role,
        email: contactForm.email,
        phone: contactForm.phone,
        company: contactForm.company,
      };

      const wardrobeNotes: WardrobeNotes = {
        outfit: wardrobeForm.outfit,
        colors: wardrobeForm.colors.split(',').map(c => c.trim()).filter(c => c),
        style: wardrobeForm.style,
        accessories: wardrobeForm.accessories.split(',').map(a => a.trim()).filter(a => a),
        makeup: wardrobeForm.makeup || undefined,
        hair: wardrobeForm.hair || undefined,
        notes: wardrobeForm.notes || undefined,
      };

      const eventData = {
        title: eventForm.title,
        type: eventForm.type,
        date: eventDateTime,
        location: eventForm.location,
        duration: eventForm.duration,
        contactPerson: contactInfo,
        talkingPoints: eventForm.talkingPoints.split('\n').filter(tp => tp.trim()),
        wardrobeNotes: Object.values(wardrobeNotes).some(v => v && (Array.isArray(v) ? v.length > 0 : true)) ? wardrobeNotes : undefined,
        status: 'scheduled' as const,
        mediaOutlets: eventForm.mediaOutlets.split(',').map(o => o.trim()).filter(o => o),
        expectedReach: eventForm.expectedReach ? parseInt(eventForm.expectedReach) : undefined,
      };

      if (editingEvent) {
        await prService.updatePREvent(editingEvent.id, eventData);
      } else {
        await prService.createPREvent(eventData);
      }

      await loadEvents();
      resetForm();
    } catch (error) {
      console.error('Error saving PR event:', error);
    }
  };

  const handleEdit = (event: PREvent) => {
    setEditingEvent(event);
    
    // Populate event form
    setEventForm({
      title: event.title,
      type: event.type,
      date: event.date.toISOString().split('T')[0],
      time: event.date.toTimeString().slice(0, 5),
      location: event.location,
      duration: event.duration,
      expectedReach: event.expectedReach?.toString() || '',
      mediaOutlets: event.mediaOutlets.join(', '),
      talkingPoints: event.talkingPoints.join('\n'),
    });

    // Populate contact form
    setContactForm({
      name: event.contactPerson.name,
      role: event.contactPerson.role,
      email: event.contactPerson.email,
      phone: event.contactPerson.phone,
      company: event.contactPerson.company,
    });

    // Populate wardrobe form
    if (event.wardrobeNotes) {
      setWardrobeForm({
        outfit: event.wardrobeNotes.outfit,
        colors: event.wardrobeNotes.colors.join(', '),
        style: event.wardrobeNotes.style,
        accessories: event.wardrobeNotes.accessories.join(', '),
        makeup: event.wardrobeNotes.makeup || '',
        hair: event.wardrobeNotes.hair || '',
        notes: event.wardrobeNotes.notes || '',
      });
    }

    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this PR event?')) {
      try {
        await prService.deletePREvent(id);
        await loadEvents();
      } catch (error) {
        console.error('Error deleting PR event:', error);
      }
    }
  };

  const handleStatusChange = async (id: string, status: PREvent['status']) => {
    try {
      await prService.updatePREvent(id, { status });
      await loadEvents();
    } catch (error) {
      console.error('Error updating event status:', error);
    }
  };

  const resetForm = () => {
    setEventForm({
      title: '',
      type: 'interview',
      date: '',
      time: '',
      location: '',
      duration: 60,
      expectedReach: '',
      mediaOutlets: '',
      talkingPoints: '',
    });
    setContactForm({
      name: '',
      role: '',
      email: '',
      phone: '',
      company: '',
    });
    setWardrobeForm({
      outfit: '',
      colors: '',
      style: '',
      accessories: '',
      makeup: '',
      hair: '',
      notes: '',
    });
    setEditingEvent(null);
    setShowForm(false);
    setActiveTab('event-details');
  };

  const getStatusIcon = (status: PREvent['status']) => {
    switch (status) {
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-500" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-gray-500" />;
      case 'cancelled':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: PREvent['status']) => {
    switch (status) {
      case 'scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
    }
  };

  const getTypeIcon = (type: PREvent['type']) => {
    switch (type) {
      case 'interview':
        return <Users className="h-4 w-4" />;
      case 'appearance':
        return <Camera className="h-4 w-4" />;
      case 'photoshoot':
        return <Camera className="h-4 w-4" />;
      case 'event':
        return <Calendar className="h-4 w-4" />;
      case 'podcast':
        return <Users className="h-4 w-4" />;
    }
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                PR Event Scheduling
              </CardTitle>
              <CardDescription>
                Schedule PR events with wardrobe and styling notes
              </CardDescription>
            </div>
            <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Schedule Event
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showForm && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>{editingEvent ? 'Edit' : 'Schedule'} PR Event</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit}>
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="event-details">Event Details</TabsTrigger>
                      <TabsTrigger value="contact-info">Contact Info</TabsTrigger>
                      <TabsTrigger value="wardrobe">Wardrobe & Styling</TabsTrigger>
                    </TabsList>

                    <TabsContent value="event-details" className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="title">Event Title</Label>
                          <Input
                            id="title"
                            value={eventForm.title}
                            onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                            placeholder="Interview with..."
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="type">Event Type</Label>
                          <Select
                            value={eventForm.type}
                            onValueChange={(value) => 
                              setEventForm({ ...eventForm, type: value as PREvent['type'] })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="interview">Interview</SelectItem>
                              <SelectItem value="appearance">TV Appearance</SelectItem>
                              <SelectItem value="photoshoot">Photoshoot</SelectItem>
                              <SelectItem value="event">Public Event</SelectItem>
                              <SelectItem value="podcast">Podcast</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <Label htmlFor="date">Date</Label>
                          <Input
                            id="date"
                            type="date"
                            value={eventForm.date}
                            onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="time">Time</Label>
                          <Input
                            id="time"
                            type="time"
                            value={eventForm.time}
                            onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="duration">Duration (minutes)</Label>
                          <Input
                            id="duration"
                            type="number"
                            value={eventForm.duration}
                            onChange={(e) => setEventForm({ ...eventForm, duration: parseInt(e.target.value) })}
                            min="15"
                            step="15"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="location">Location</Label>
                        <Input
                          id="location"
                          value={eventForm.location}
                          onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                          placeholder="Studio address or venue"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="mediaOutlets">Media Outlets (comma-separated)</Label>
                          <Input
                            id="mediaOutlets"
                            value={eventForm.mediaOutlets}
                            onChange={(e) => setEventForm({ ...eventForm, mediaOutlets: e.target.value })}
                            placeholder="TV Show, Magazine, Website"
                          />
                        </div>
                        <div>
                          <Label htmlFor="expectedReach">Expected Reach</Label>
                          <Input
                            id="expectedReach"
                            type="number"
                            value={eventForm.expectedReach}
                            onChange={(e) => setEventForm({ ...eventForm, expectedReach: e.target.value })}
                            placeholder="Estimated audience size"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="talkingPoints">Talking Points (one per line)</Label>
                        <Textarea
                          id="talkingPoints"
                          value={eventForm.talkingPoints}
                          onChange={(e) => setEventForm({ ...eventForm, talkingPoints: e.target.value })}
                          placeholder="Key message 1&#10;Key message 2&#10;Key message 3"
                          rows={4}
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="contact-info" className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="contactName">Contact Name</Label>
                          <Input
                            id="contactName"
                            value={contactForm.name}
                            onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                            placeholder="Producer, Journalist, etc."
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="contactRole">Role/Title</Label>
                          <Input
                            id="contactRole"
                            value={contactForm.role}
                            onChange={(e) => setContactForm({ ...contactForm, role: e.target.value })}
                            placeholder="Producer, Editor, Host"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="contactEmail">Email</Label>
                          <Input
                            id="contactEmail"
                            type="email"
                            value={contactForm.email}
                            onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                            placeholder="contact@media.com"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="contactPhone">Phone</Label>
                          <Input
                            id="contactPhone"
                            type="tel"
                            value={contactForm.phone}
                            onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                            placeholder="+1 (555) 123-4567"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="contactCompany">Company/Organization</Label>
                        <Input
                          id="contactCompany"
                          value={contactForm.company}
                          onChange={(e) => setContactForm({ ...contactForm, company: e.target.value })}
                          placeholder="TV Network, Magazine, Website"
                          required
                        />
                      </div>
                    </TabsContent>

                    <TabsContent value="wardrobe" className="space-y-4 mt-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="outfit">Outfit Description</Label>
                          <Input
                            id="outfit"
                            value={wardrobeForm.outfit}
                            onChange={(e) => setWardrobeForm({ ...wardrobeForm, outfit: e.target.value })}
                            placeholder="Business casual, formal dress, etc."
                          />
                        </div>
                        <div>
                          <Label htmlFor="style">Style Theme</Label>
                          <Input
                            id="style"
                            value={wardrobeForm.style}
                            onChange={(e) => setWardrobeForm({ ...wardrobeForm, style: e.target.value })}
                            placeholder="Professional, casual, glamorous"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="colors">Colors (comma-separated)</Label>
                        <Input
                          id="colors"
                          value={wardrobeForm.colors}
                          onChange={(e) => setWardrobeForm({ ...wardrobeForm, colors: e.target.value })}
                          placeholder="Navy blue, white, gold"
                        />
                      </div>

                      <div>
                        <Label htmlFor="accessories">Accessories (comma-separated)</Label>
                        <Input
                          id="accessories"
                          value={wardrobeForm.accessories}
                          onChange={(e) => setWardrobeForm({ ...wardrobeForm, accessories: e.target.value })}
                          placeholder="Watch, necklace, earrings"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="makeup">Makeup Notes</Label>
                          <Input
                            id="makeup"
                            value={wardrobeForm.makeup}
                            onChange={(e) => setWardrobeForm({ ...wardrobeForm, makeup: e.target.value })}
                            placeholder="Natural, bold, camera-ready"
                          />
                        </div>
                        <div>
                          <Label htmlFor="hair">Hair Notes</Label>
                          <Input
                            id="hair"
                            value={wardrobeForm.hair}
                            onChange={(e) => setWardrobeForm({ ...wardrobeForm, hair: e.target.value })}
                            placeholder="Styled, natural, updo"
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="wardrobeNotes">Additional Notes</Label>
                        <Textarea
                          id="wardrobeNotes"
                          value={wardrobeForm.notes}
                          onChange={(e) => setWardrobeForm({ ...wardrobeForm, notes: e.target.value })}
                          placeholder="Special requirements, backup options, etc."
                          rows={3}
                        />
                      </div>
                    </TabsContent>
                  </Tabs>

                  <div className="flex gap-2 mt-6">
                    <Button type="submit">
                      {editingEvent ? 'Update' : 'Schedule'} Event
                    </Button>
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Cancel
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          <div className="space-y-4">
            {events.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No PR events scheduled. Schedule your first event to get started.
              </div>
            ) : (
              events.map((event) => (
                <Card key={event.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getTypeIcon(event.type)}
                          <h3 className="font-semibold">{event.title}</h3>
                          <Badge variant="outline">{event.type}</Badge>
                          <Badge className={getStatusColor(event.status)}>
                            {getStatusIcon(event.status)}
                            <span className="ml-1">{event.status}</span>
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Calendar className="h-4 w-4" />
                              {formatDateTime(event.date)}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Clock className="h-4 w-4" />
                              {event.duration} minutes
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <MapPin className="h-4 w-4" />
                              {event.location}
                            </div>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Building className="h-4 w-4" />
                              {event.contactPerson.company}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Users className="h-4 w-4" />
                              {event.contactPerson.name} ({event.contactPerson.role})
                            </div>
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <Mail className="h-4 w-4" />
                              {event.contactPerson.email}
                            </div>
                          </div>
                        </div>

                        {event.wardrobeNotes && (
                          <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Shirt className="h-4 w-4" />
                              <span className="font-medium text-sm">Wardrobe & Styling</span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                              {event.wardrobeNotes.outfit && (
                                <div><strong>Outfit:</strong> {event.wardrobeNotes.outfit}</div>
                              )}
                              {event.wardrobeNotes.style && (
                                <div><strong>Style:</strong> {event.wardrobeNotes.style}</div>
                              )}
                              {event.wardrobeNotes.colors.length > 0 && (
                                <div><strong>Colors:</strong> {event.wardrobeNotes.colors.join(', ')}</div>
                              )}
                              {event.wardrobeNotes.accessories.length > 0 && (
                                <div><strong>Accessories:</strong> {event.wardrobeNotes.accessories.join(', ')}</div>
                              )}
                            </div>
                          </div>
                        )}

                        {event.talkingPoints.length > 0 && (
                          <div className="mb-2">
                            <p className="text-sm font-medium text-gray-700 mb-1">Talking Points:</p>
                            <ul className="text-sm text-gray-600 list-disc list-inside">
                              {event.talkingPoints.map((point, index) => (
                                <li key={index}>{point}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {event.mediaOutlets.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {event.mediaOutlets.map((outlet, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {outlet}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col gap-2 ml-4">
                        {event.status === 'scheduled' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleStatusChange(event.id, 'confirmed')}
                            className="flex items-center gap-1 text-green-600 hover:text-green-700"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Confirm
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(event)}
                          className="flex items-center gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(event.id)}
                          className="flex items-center gap-1 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-3 w-3" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}