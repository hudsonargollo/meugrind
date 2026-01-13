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
  MessageSquare, 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Calendar,
  Users,
  AlertTriangle
} from 'lucide-react';
import { TalkingPoint, ApprovedNarrative } from '../../types/pr';
import { prService } from '../../lib/pr-service';

interface TalkingPointsRepositoryProps {
  className?: string;
}

export function TalkingPointsRepository({ className }: TalkingPointsRepositoryProps) {
  const [talkingPoints, setTalkingPoints] = useState<TalkingPoint[]>([]);
  const [narratives, setNarratives] = useState<ApprovedNarrative[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('talking-points');
  
  // Talking Points Form State
  const [showTalkingPointForm, setShowTalkingPointForm] = useState(false);
  const [editingTalkingPoint, setEditingTalkingPoint] = useState<TalkingPoint | null>(null);
  const [talkingPointForm, setTalkingPointForm] = useState({
    category: '',
    topic: '',
    keyMessage: '',
    supportingFacts: '',
    doNotMention: '',
  });

  // Narratives Form State
  const [showNarrativeForm, setShowNarrativeForm] = useState(false);
  const [editingNarrative, setEditingNarrative] = useState<ApprovedNarrative | null>(null);
  const [narrativeForm, setNarrativeForm] = useState({
    title: '',
    category: 'personal_story' as ApprovedNarrative['category'],
    narrative: '',
    keyPoints: '',
    variations: '',
    expirationDate: '',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [pointsData, narrativesData] = await Promise.all([
        prService.getAllTalkingPoints(),
        prService.getAllApprovedNarratives(),
      ]);
      setTalkingPoints(pointsData);
      setNarratives(narrativesData);
    } catch (error) {
      console.error('Error loading talking points and narratives:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Talking Points Functions
  const handleTalkingPointSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const pointData = {
        category: talkingPointForm.category,
        topic: talkingPointForm.topic,
        keyMessage: talkingPointForm.keyMessage,
        supportingFacts: talkingPointForm.supportingFacts.split('\n').filter(f => f.trim()),
        doNotMention: talkingPointForm.doNotMention.split('\n').filter(d => d.trim()),
        approved: false,
        lastUpdated: new Date(),
      };

      if (editingTalkingPoint) {
        await prService.updateTalkingPoint(editingTalkingPoint.id, pointData);
      } else {
        await prService.createTalkingPoint(pointData);
      }

      await loadData();
      resetTalkingPointForm();
    } catch (error) {
      console.error('Error saving talking point:', error);
    }
  };

  const handleEditTalkingPoint = (point: TalkingPoint) => {
    setEditingTalkingPoint(point);
    setTalkingPointForm({
      category: point.category,
      topic: point.topic,
      keyMessage: point.keyMessage,
      supportingFacts: point.supportingFacts.join('\n'),
      doNotMention: point.doNotMention.join('\n'),
    });
    setShowTalkingPointForm(true);
  };

  const handleDeleteTalkingPoint = async (id: string) => {
    if (confirm('Are you sure you want to delete this talking point?')) {
      try {
        await prService.deleteTalkingPoint(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting talking point:', error);
      }
    }
  };

  const handleApproveTalkingPoint = async (id: string) => {
    try {
      await prService.approveTalkingPoint(id);
      await loadData();
    } catch (error) {
      console.error('Error approving talking point:', error);
    }
  };

  const resetTalkingPointForm = () => {
    setTalkingPointForm({
      category: '',
      topic: '',
      keyMessage: '',
      supportingFacts: '',
      doNotMention: '',
    });
    setEditingTalkingPoint(null);
    setShowTalkingPointForm(false);
  };

  // Narratives Functions
  const handleNarrativeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const narrativeData = {
        title: narrativeForm.title,
        category: narrativeForm.category,
        narrative: narrativeForm.narrative,
        keyPoints: narrativeForm.keyPoints.split('\n').filter(p => p.trim()),
        variations: narrativeForm.variations.split('\n').filter(v => v.trim()),
        mediaOutlets: [],
        expirationDate: narrativeForm.expirationDate ? new Date(narrativeForm.expirationDate) : undefined,
        approved: false,
        approvedBy: 'system', // This should be the current user
      };

      if (editingNarrative) {
        await prService.updateApprovedNarrative(editingNarrative.id, narrativeData);
      } else {
        await prService.createApprovedNarrative(narrativeData);
      }

      await loadData();
      resetNarrativeForm();
    } catch (error) {
      console.error('Error saving narrative:', error);
    }
  };

  const handleEditNarrative = (narrative: ApprovedNarrative) => {
    setEditingNarrative(narrative);
    setNarrativeForm({
      title: narrative.title,
      category: narrative.category,
      narrative: narrative.narrative,
      keyPoints: narrative.keyPoints.join('\n'),
      variations: narrative.variations.join('\n'),
      expirationDate: narrative.expirationDate ? narrative.expirationDate.toISOString().split('T')[0] : '',
    });
    setShowNarrativeForm(true);
  };

  const handleDeleteNarrative = async (id: string) => {
    if (confirm('Are you sure you want to delete this narrative?')) {
      try {
        await prService.deleteApprovedNarrative(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting narrative:', error);
      }
    }
  };

  const resetNarrativeForm = () => {
    setNarrativeForm({
      title: '',
      category: 'personal_story',
      narrative: '',
      keyPoints: '',
      variations: '',
      expirationDate: '',
    });
    setEditingNarrative(null);
    setShowNarrativeForm(false);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isNarrativeExpired = (narrative: ApprovedNarrative) => {
    return narrative.expirationDate && narrative.expirationDate < new Date();
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
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Talking Points & Narratives Repository
          </CardTitle>
          <CardDescription>
            Manage approved talking points and narratives for consistent messaging
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="talking-points" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Talking Points
              </TabsTrigger>
              <TabsTrigger value="narratives" className="flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Approved Narratives
              </TabsTrigger>
            </TabsList>

            <TabsContent value="talking-points" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Talking Points</h3>
                <Button onClick={() => setShowTalkingPointForm(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Talking Point
                </Button>
              </div>

              {showTalkingPointForm && (
                <Card>
                  <CardHeader>
                    <CardTitle>{editingTalkingPoint ? 'Edit' : 'Add'} Talking Point</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleTalkingPointSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Input
                            id="category"
                            value={talkingPointForm.category}
                            onChange={(e) => setTalkingPointForm({ ...talkingPointForm, category: e.target.value })}
                            placeholder="e.g., Career, Personal, Show"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="topic">Topic</Label>
                          <Input
                            id="topic"
                            value={talkingPointForm.topic}
                            onChange={(e) => setTalkingPointForm({ ...talkingPointForm, topic: e.target.value })}
                            placeholder="Main topic or subject"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="keyMessage">Key Message</Label>
                        <Textarea
                          id="keyMessage"
                          value={talkingPointForm.keyMessage}
                          onChange={(e) => setTalkingPointForm({ ...talkingPointForm, keyMessage: e.target.value })}
                          placeholder="The main message to communicate"
                          rows={3}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="supportingFacts">Supporting Facts (one per line)</Label>
                        <Textarea
                          id="supportingFacts"
                          value={talkingPointForm.supportingFacts}
                          onChange={(e) => setTalkingPointForm({ ...talkingPointForm, supportingFacts: e.target.value })}
                          placeholder="Fact 1&#10;Fact 2&#10;Fact 3"
                          rows={4}
                        />
                      </div>

                      <div>
                        <Label htmlFor="doNotMention">Do Not Mention (one per line)</Label>
                        <Textarea
                          id="doNotMention"
                          value={talkingPointForm.doNotMention}
                          onChange={(e) => setTalkingPointForm({ ...talkingPointForm, doNotMention: e.target.value })}
                          placeholder="Topic to avoid 1&#10;Topic to avoid 2"
                          rows={3}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit">
                          {editingTalkingPoint ? 'Update' : 'Create'} Talking Point
                        </Button>
                        <Button type="button" variant="outline" onClick={resetTalkingPointForm}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                {talkingPoints.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No talking points found. Add your first talking point to get started.
                  </div>
                ) : (
                  talkingPoints.map((point) => (
                    <Card key={point.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{point.topic}</h4>
                              <Badge variant="outline">{point.category}</Badge>
                              {point.approved ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approved
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-700 mb-3">{point.keyMessage}</p>
                            
                            {point.supportingFacts.length > 0 && (
                              <div className="mb-2">
                                <p className="text-xs font-medium text-gray-600 mb-1">Supporting Facts:</p>
                                <ul className="text-xs text-gray-600 list-disc list-inside">
                                  {point.supportingFacts.map((fact, index) => (
                                    <li key={index}>{fact}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            {point.doNotMention.length > 0 && (
                              <div className="mb-2">
                                <p className="text-xs font-medium text-red-600 mb-1">Do Not Mention:</p>
                                <ul className="text-xs text-red-600 list-disc list-inside">
                                  {point.doNotMention.map((item, index) => (
                                    <li key={index}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            
                            <p className="text-xs text-gray-500">
                              Last updated: {formatDate(point.lastUpdated)}
                            </p>
                          </div>

                          <div className="flex gap-2 ml-4">
                            {!point.approved && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleApproveTalkingPoint(point.id)}
                                className="flex items-center gap-1 text-green-600 hover:text-green-700"
                              >
                                <CheckCircle className="h-3 w-3" />
                                Approve
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditTalkingPoint(point)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="h-3 w-3" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteTalkingPoint(point.id)}
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
            </TabsContent>

            <TabsContent value="narratives" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Approved Narratives</h3>
                <Button onClick={() => setShowNarrativeForm(true)} className="flex items-center gap-2">
                  <Plus className="h-4 w-4" />
                  Add Narrative
                </Button>
              </div>

              {showNarrativeForm && (
                <Card>
                  <CardHeader>
                    <CardTitle>{editingNarrative ? 'Edit' : 'Add'} Narrative</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleNarrativeSubmit} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="narrativeTitle">Title</Label>
                          <Input
                            id="narrativeTitle"
                            value={narrativeForm.title}
                            onChange={(e) => setNarrativeForm({ ...narrativeForm, title: e.target.value })}
                            placeholder="Narrative title"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="narrativeCategory">Category</Label>
                          <Select
                            value={narrativeForm.category}
                            onValueChange={(value) => 
                              setNarrativeForm({ ...narrativeForm, category: value as ApprovedNarrative['category'] })
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="personal_story">Personal Story</SelectItem>
                              <SelectItem value="career_highlight">Career Highlight</SelectItem>
                              <SelectItem value="future_plans">Future Plans</SelectItem>
                              <SelectItem value="controversy_response">Controversy Response</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="narrativeText">Narrative</Label>
                        <Textarea
                          id="narrativeText"
                          value={narrativeForm.narrative}
                          onChange={(e) => setNarrativeForm({ ...narrativeForm, narrative: e.target.value })}
                          placeholder="The full narrative text"
                          rows={6}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="keyPoints">Key Points (one per line)</Label>
                        <Textarea
                          id="keyPoints"
                          value={narrativeForm.keyPoints}
                          onChange={(e) => setNarrativeForm({ ...narrativeForm, keyPoints: e.target.value })}
                          placeholder="Key point 1&#10;Key point 2&#10;Key point 3"
                          rows={4}
                        />
                      </div>

                      <div>
                        <Label htmlFor="variations">Variations (one per line)</Label>
                        <Textarea
                          id="variations"
                          value={narrativeForm.variations}
                          onChange={(e) => setNarrativeForm({ ...narrativeForm, variations: e.target.value })}
                          placeholder="Short version&#10;Detailed version&#10;Casual version"
                          rows={3}
                        />
                      </div>

                      <div>
                        <Label htmlFor="expirationDate">Expiration Date (optional)</Label>
                        <Input
                          id="expirationDate"
                          type="date"
                          value={narrativeForm.expirationDate}
                          onChange={(e) => setNarrativeForm({ ...narrativeForm, expirationDate: e.target.value })}
                        />
                      </div>

                      <div className="flex gap-2">
                        <Button type="submit">
                          {editingNarrative ? 'Update' : 'Create'} Narrative
                        </Button>
                        <Button type="button" variant="outline" onClick={resetNarrativeForm}>
                          Cancel
                        </Button>
                      </div>
                    </form>
                  </CardContent>
                </Card>
              )}

              <div className="space-y-4">
                {narratives.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No narratives found. Add your first narrative to get started.
                  </div>
                ) : (
                  narratives.map((narrative) => (
                    <Card key={narrative.id} className={isNarrativeExpired(narrative) ? 'border-red-200' : ''}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold">{narrative.title}</h4>
                              <Badge variant="outline">{narrative.category.replace('_', ' ')}</Badge>
                              {narrative.approved ? (
                                <Badge className="bg-green-100 text-green-800">
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Approved
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                                  <XCircle className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                              )}
                              {isNarrativeExpired(narrative) && (
                                <Badge className="bg-red-100 text-red-800">
                                  <AlertTriangle className="h-3 w-3 mr-1" />
                                  Expired
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-gray-700 mb-3 line-clamp-3">{narrative.narrative}</p>
                            
                            {narrative.keyPoints.length > 0 && (
                              <div className="mb-2">
                                <p className="text-xs font-medium text-gray-600 mb-1">Key Points:</p>
                                <div className="flex flex-wrap gap-1">
                                  {narrative.keyPoints.map((point, index) => (
                                    <Badge key={index} variant="outline" className="text-xs">
                                      {point}
                                    </Badge>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500">
                              {narrative.lastUsed && (
                                <div className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  Last used: {formatDate(narrative.lastUsed)}
                                </div>
                              )}
                              {narrative.mediaOutlets.length > 0 && (
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  Used in {narrative.mediaOutlets.length} outlets
                                </div>
                              )}
                              {narrative.expirationDate && (
                                <div className="flex items-center gap-1">
                                  <AlertTriangle className="h-3 w-3" />
                                  Expires: {formatDate(narrative.expirationDate)}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex gap-2 ml-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditNarrative(narrative)}
                              className="flex items-center gap-1"
                            >
                              <Edit className="h-3 w-3" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteNarrative(narrative.id)}
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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}