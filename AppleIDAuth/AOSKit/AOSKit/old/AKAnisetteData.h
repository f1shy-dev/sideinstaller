@interface AKAnisetteData : NSObject <NSCopying, NSSecureCoding> {
    NSString * _machineID;
    NSString * _oneTimePassword;
    unsigned long long  _routingInfo;
}

@property (nonatomic, copy) NSString *machineID;
@property (nonatomic, copy) NSString *oneTimePassword;
@property (nonatomic) unsigned long long routingInfo;

+ (BOOL)supportsSecureCoding;

//- (void).cxx_destruct;
- (id)copyWithZone:(struct _NSZone { }*)arg1;
- (id)description;
- (void)encodeWithCoder:(id)arg1;
- (id)initWithCoder:(id)arg1;
- (id)machineID;
- (id)oneTimePassword;
- (unsigned long long)routingInfo;
- (void)setMachineID:(id)arg1;
- (void)setOneTimePassword:(id)arg1;
- (void)setRoutingInfo:(unsigned long long)arg1;

@end
